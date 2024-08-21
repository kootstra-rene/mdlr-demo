mdlr('[web]tutorial:pokemon-api', m => {

  m.html`
  <select on{change}>
  <option value="">- choose a pokemon -</option>
  {#each pm in pokemons}
    <option value={pm.name}>{pm.name}</option>
  {/each}
  </select>
  <br/>
  <div hidden={!pokemon || !img.complete || isNaN(audio.duration)}>
    <img{} src={pokemon?.sprites.front_default}/>
    <audio{} controls src={pokemon?.cries.latest}/>
  </div>`;

  m.style`
  display: block;
  overflow: auto;
  height: 100%;

  div {
    display: flex;
    align-items: center;
    height: 96px;

    & > img {
      width: 96px;
    }
  }

  div[hidden] > * {
    display: none;
  }
  `;

  return class {
    pokemons;
    pokemon;
    audio;
    img

    async connected() {
      const result = await fetch('https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0').then(r => r.json());
      result.results.sort((a, b) => a.name.localeCompare(b.name));

      this.pokemons = result.results;
    }

    async change(e) {
      for (const option of e.target.selectedOptions) {
        const pokemon = this.pokemons.find(a => a.name === option.value);

        this.pokemon = null;
        this.pokemon = await fetch(pokemon.url).then(r => r.json());
        // console.log(this.pokemon);  
      }
    }
  }

})