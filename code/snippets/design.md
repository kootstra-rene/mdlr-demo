
## slots (todo)

Though similar to the shadowDOM slot, this element will not occur in the lightDOM and is used by MDLR to inject html into a **[web]**-*component*.  
This works on the premise that if you insert an element in the DOM and that element is already part of the DOM the element simply moves location.

template **m-panel**
```JavaScript
html`
  <summary><slot name="caption" /></summary>
  <slot name="content" />
`
```

usage
```JavaScript
html`
  <m-panel>
    <span slot="caption">caption</span>
    <div slot="content">
      <button>click</button>
    </div>
  </m-panel>
`
```

yields
```HTML
<m-panel>
  <summary><span slot="caption">caption</span></summary>
  <div slot="content">
    <button>click</button>
  </div>
</m-panel>
```

The `slot="..."` is kept in the DOM because of CSS styling posibilies.