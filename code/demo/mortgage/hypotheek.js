mdlr('[web]mux:scroll-ruler', m => {

  m.html`
  <div style="width:{width}px"/>
  `;

  m.style`
  height: 4px;
  width: 100%;

  > div {
    background-color: #8bc;
    height: 4px;
  }
  `;

  return class {
    anchor;

    connected(e) {
      this.anchor = this.anchor || e.parentNode;
    }

    get width() {
      const { anchor } = this;

      if (!anchor) return 0;

      return anchor.offsetWidth * anchor.scrollTop / (anchor.scrollHeight - anchor.offsetHeight);
    }
  }

})

mdlr('[web]tools:mortgage-app', m => {

  m.require('[web]mux:scroll-ruler');

  function interest(rate, payments, debt, def) {
    let r = rate / 100.0 / 12.0;
    let state = { interest: 0.0, payoff: 0.0, deposit: 0.0, debt };

    return {
      peek: (mon, ammount) => {
        if (mon < def.from || state.debt <= 0) {
          return { interest: 0.0, payoff: 0.0, debt:0};
        }
        let debt = state.debt - (ammount ?? 0);
        let interest = debt * r;
        return { interest, payoff: 0.0, debt };
      },
      next: (mon) => {
        if (mon < def.from || state.debt <= 0) {
          return { interest: 0.0, payoff: 0.0, deposit: 0.0, debt: 0.0 };
        }
        state.interest = state.debt * r;
        return state;
      },
      deposit: (ammount) => {
        ammount = Math.max(Math.min(ammount, state.debt), 0);
        state.deposit = ammount;
        state.debt -= state.deposit;
        return state;
      },
    };
  }

  function linear(rate, payments, debt) {
    let r = rate / 100.0 / 12.0;
    let state = { interest: 0.0, payoff: 0.0, deposit: 0.0, debt };

    return {
      next: () => {
        if (payments <= 0 || state.debt <= 0) {
          return { interest: 0.0, payoff: 0.0, deposit: 0.0, debt: 0.0 };
        }
        state.interest = state.debt * r;
        state.payoff = state.debt / payments--;
        state.debt -= state.payoff;
        return state;
      },
      deposit: (ammount) => {
        ammount = Math.max(Math.min(ammount, state.debt), 0);
        state.deposit = ammount;
        state.debt -= ammount;
        return state;
      },
    };
  }

  function annuity(rate, payments, debt, def) {
    let r = rate / 100.0 / 12.0;
    let state = { interest: 0.0, payoff: 0.0, deposit: 0.0, debt };

    const pmt = (rate, payments, principal) => (rate / (1 - Math.pow(1 + rate, -payments))) * principal;
    
    return {
      peek: (mon, ammount) => {
        if (mon < def.from || payments <= 0 || state.debt <= 0) {
          return { interest: 0.0, payoff: 0.0, debt: 0 };
        }
        let debt = state.debt - ammount;
        let interest = debt * r;
        let payoff = pmt(r, payments, debt) - interest;
        return { interest, payoff, debt };
      },
      next: (mon) => {
        if (mon < def.from || payments <= 0 || state.debt <= 0) {
          return { interest: 0.0, payoff: 0.0, deposit: 0.0, debt: 0.0 };
        }
        state.interest = state.debt * r;
        state.payoff = pmt(r, payments--, state.debt) - state.interest;
        state.debt -= state.payoff;
        return state;
      },
      deposit: (ammount) => {
        if (payments <= 0 || state.debt <= 0) {
          return { interest: 0.0, payoff: 0.0, deposit: 0.0 };
        }
        ammount = Math.max(Math.min(ammount, state.debt), 0);
        state.deposit = ammount;
        state.debt -= ammount;
        return state;
      },
    };
  }

  function banksaving(rate, payments, debt) {
    let r = rate / 100.0 / 12.0;
    let state = { interest: debt * r, payoff: 0.0, deposit: 0.0, debt };

    let lut = [];
    for (let i = 0; i <= payments; ++i) {
      lut.push(Math.pow(1.0 + r, i));
    }

    let acc = [];
    for (let i = 0; i < payments; ++i) {
      acc.push(
        lut.slice(0, payments - i).reduce((a, b) => {
          return a + b;
        })
      );
    }
    acc.reverse();

    return {
      next: () => {
        if (payments <= 0 || debt <= 0) {
          return { interest: 0.0, payoff: 0.0, deposit: 0.0, debt: 0.0 };
        }
        --payments;
        let term = debt / acc[payments];
        state.deposit = term;
        debt -= term * lut[payments];
        return state;
      },
      deposit: (ammount) => {
        ammount = Math.max(Math.min(ammount, debt), 0);
        state.deposit += ammount;
        debt -= ammount * lut[payments];
        return state;
      },
    };
  }

  function getTimeLine(a, b) {
    const mon = 12 * ((b.from / 100) >>> 0) + (b.from % 100);
    if (a.min === undefined || mon < a.min) a.min = mon;
    if (a.max === undefined || mon + b.term > a.max) a.max = mon + b.term;
    return a;
  }

  function calculate(parts, deposit, cb = () => { }) {
    const time = parts.reduce(getTimeLine, {});
    // console.error(time);

    const calc = parts.map(a => ({ ...a, ...a.type(a.rate, a.term, a.debt, a) }));

    for (let m = time.min; m < time.max; m++) {
      let month = `${(m / 12) >>> 0}.${("00" + (1 + (m % 12))).substr(-2)}`;
      let mon = parseInt(month.replace(".", ""), 10);
      let data = calc.reduce((a, b) => {
        a.push({
          uuid: b.uuid,
          state: b.next(mon),
          debt: b.debt,
          post: b.post,
          rate: b.rate,
          calc: b,
        });
        return a;
      }, []);

      if (deposit) deposit(mon, data);
      let out = data.map(a => ({ ...a.state }));
      out.month = month;
      out.value = 610000; // todo: add taxations

      data.reduce((a, b) => {
        a.debt = b.state.debt + (a.debt || 0);
        a.interest = b.state.interest + (a.interest || 0);
        a.payoff = b.state.payoff + (a.payoff || 0);
        a.deposit = b.state.deposit + (a.deposit || 0);
        return a;
      }, out);

      out.save = (mon < 202501) ? 0 : (mon < 203501 ? 3500 : 3500) - (out.interest+out.payoff+out.deposit);//(mon < 202501) ? 0 : (mon < 203501) ? 500 : 500;
      if (out.save < 0) out.save = 0;
      // out.save = 0;//(mon < 202501) ? 0 : (mon < 203501 ? 1600 : 0);
      // out.save = 0;

      cb(out);
      // console.log(month + "|" + out.join("|").replace(/\./g, ","));
    }
  }

  function schemeFixedMonthlyCost(mon, a) {
    // done=true;return false;
    if (mon < 202501) return false;

    let monthlyCost = a.reduce(
      (a, b) => a + b.state.interest + b.state.payoff,
      0
    );
    // let fixedCost = monthlyCost;
    // if (mon >= 202201) fixedCost = 2250 + 1000 + 750;

    // let monthlyDeposit = Math.max(fixedCost - monthlyCost, 0);
    let monthlyDeposit = ((mon < 203501) ? 3500 : 3500) - (monthlyCost ?? 0);
    if (monthlyDeposit < 0) monthlyDeposit = 0;
    // if (isNaN(monthlyDeposit)) debugger;
    // monthlyDeposit = (mon < 202501) ? 0 : (mon < 203501 ? 1600 : 0);

    const costs = a
      .filter((a) => a.state.debt > 0)
      .map((a) => {
        let currTerm = a.state;
        let nextTerm = a.calc.peek(mon, monthlyDeposit);
        // if (isNaN(nextTerm.debt)) debugger;
        let nextCost = 0 * nextTerm.payoff + 1 * nextTerm.interest;
        let currCost = 0 * currTerm.payoff + 1 * currTerm.interest;
        // let currCost = a.debt, nextCost = nextTerm.debt;
        // let nextCost = Math.max(nextTerm.payoff, nextTerm.interest);
        // let currCost = Math.max(currTerm.payoff, currTerm.interest);
        return {
          uuid: a.uuid,
          debt: a.debt,
          cost: currCost - nextCost,
          loan: a.calc,
          rate: a.rate,
        };
      });

    costs.sort((a, b) => {
      if (a.cost > b.cost) return -1;
      if (a.cost < b.cost) return +1;
      return 0;
    });

    // console.log(costs);

    costs.forEach((c) => {
      let year = (mon / 100) >>> 0;
      if (undefined === this[c.uuid]) this[c.uuid] = {};
      if (undefined === this[c.uuid][year])
        this[c.uuid][year] = c.debt;//((c.debt * 10.0) / 100.0) >>> 0;

      let ammount =
        this[c.uuid][year] >= monthlyDeposit
          ? monthlyDeposit
          : this[c.uuid][year];

      // ammount = monthlyDeposit;
      this[c.uuid][year] -= ammount;
      monthlyDeposit -= ammount;
      c.loan.deposit(ammount);
    });
    done = true;
  }

  let done = false;

  let state = {};
  const totals = {};
  const records = [];
  const mortgages = [{
    uuid: 'H1042144-1',
    debt: 190000,
    from: 201707,
    term: 30 * 12,
    rate: 3.24,
    type: interest,
  }, {
    uuid: 'H1042144-2',
    debt: 147500,
    from: 201707,
    term: 30 * 12,
    rate: 3.24,
    type: annuity,
  }, {
    uuid: 'H1042144-3',
    debt: 60000,
    from: 201707,
    term: 30 * 12,
    rate: 3.24,
    type: annuity,
  }, {
    uuid: 'H1221271',
    debt: 222000,
    from: 201912,
    term: 30 * 12,
    rate: 1.99,
    type: annuity,
  }];

  calculate(mortgages, schemeFixedMonthlyCost.bind(state), out => {
    const ipm = 1 + (0.02 / 12);
    totals.interest = (totals.interest || 0) + out.interest;
    totals.payoff = (totals.payoff || 0) + out.payoff;
    totals.deposit = (totals.deposit || 0) + out.deposit;
    totals.save = (totals.save || 0) * ipm + out.save;
    records.push({...out, totalSaved: totals.save});
  });
  // }],
  // schemeFixedMonthlyCost.bind(state));


  // console.error(state);

  function round(v) {
    if (v === undefined) return "";
    return (Math.round(v * 100) / 100).toFixed(2);
  }

  m.html`
  <h2>Mortgage Calculator</h2>
  <div>
      <div>id</div>
      <div>debt</div>
      <div>rate</div>
      <div>type</div>
      <div></div>
      <div>from</div>
      <div>terms</div>
    {#each m in mortgages}
      <div>{m.uuid}</div>
      <div>{m.debt}</div>
      <div>{m.rate}</div>
      <div>{type(m.type)}</div>
      <div></div>
      <div>{m.from}</div>
      <div>{m.term}</div>
    {/each}
  </div>
  
  <scroll-ruler .anchor={} />
  <div{anchor}>
      <div>term</div>
      <div>interest</div>
      <div>payoff</div>
      <div>deposit</div>
      <div>monthly</div>
      <div/>
      <div>debt</div>
      <div>percentage</div>
      <div/>
      <div>save</div>
    {#each record in records}
      <div>{record.month}</div>
      <div>{record.interest.toFixed(2)}</div>
      <div>{record.payoff.toFixed(2)}</div>
      <div>{record.deposit.toFixed(2)}</div>
      <div>{(record.interest + record.payoff).toFixed(2)}/{(record.interest + record.payoff + record.deposit).toFixed(2)}</div>
      <div/>
      <div>{record.debt.toFixed(2)}</div>
      <div>{(record.debt / record.value * 100).toFixed(2)}</div>
      <div/>
      <div>{record.save.toFixed(2)}/{record.totalSaved.toFixed(2)}</div>
    {/each}
      <div/>
      <div>{totals.interest.toFixed(2)}</div>
      <div>{totals.payoff.toFixed(2)}</div>
      <div>{totals.deposit.toFixed(2)}</div>
      <div>{(totals.interest + totals.payoff + totals.deposit).toFixed(2)}</div>
      <div/>
      <div/>
      <div/>
      <div/>
      <div>{totals.save.toFixed(2)}</div>
  </div>
  `;

  m.style`
  display: flex;
  flex-direction: column;
  height:100%;
  overflow: hidden;
  user-select: none;
  padding: 0.5rem;

  > div {
    position: relative;
    overflow: hidden auto;
    scrollbar-width: none;
    white-space: nowrap;

    thead {
      background-color: white;
      position: sticky;
      top: -1px;
    }

    &::-webkit-scrollbar {
      display: none;
    }
  }

  > div {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr auto 1fr 1fr;
    width: fit-content;
    border-top: 1px solid black;

    > div {
      border-bottom: 1px solid black;
      padding: 0.25rem 0.5rem;
      text-align: center;
    }
    
    > div:nth-child(-n+7) {
      background-color: lightgray;
      font-weight: bold;
    }
  }

  > div:last-child {
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr auto 1fr 1fr auto 1fr;
    flex: 1;

    > div:nth-child(-n+10) {
      background-color: lightgray;
      font-weight: bold;
      position: sticky;
      top: 0;
    }
    > div:nth-last-child(-n+10) {
      background-color: lightgray;
      font-weight: bold;
      font-style: italic;
      position: sticky;
      bottom: 0;
    }
    
    > div:nth-child(n+11):nth-last-child(n+11) {

      &:nth-child(20n+1), &:nth-child(20n+2), &:nth-child(20n+3), &:nth-child(20n+4), &:nth-child(20n+5), &:nth-child(20n+6), &:nth-child(20n+7), &:nth-child(20n+8), &:nth-child(20n+9), &:nth-child(20n+10){
        background-color: #eee;
      }
    }

    /* column */
    > div:nth-child(10n+1):nth-child(n+10):nth-last-child(n+11) {
      background-color: #eee;
      font-weight: bold;
      font-style: italic;
    }
  }

  div:empty {
    padding: 0;
  }
  `;

  return class {
    anchor;
    mortgages = mortgages;
    records = records;
    totals = totals;

    type(type) {
      if (type === annuity) return 'annuity';
      if (type === interest) return 'interest';
      return '???';
    }

    $stable() {
      // as everything is static for this component nothing will trigger an update.
      return [];
    }
  }
})
