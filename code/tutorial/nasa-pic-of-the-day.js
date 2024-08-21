mdlr('[web]tutorial:nasa-pic-of-the-day', m => {

  m.html`
  {result?.title}<br/>
  <img{} hidden={!img?.complete} src={result?.url}/>
  {result?.explanation}<br/><br/>
  {result?.date} - {result?.copyright}
  `;

  m.style`
  box-sizing: border-box;
  padding: 0.5rem;
  display: block;

  & > img {
    padding: 0.5rem 0;
    width: 100%;
  }`;

  return class {
    img;
    result;

    async connected() {
      // todo: add cache due to rate nasa limiting.
      this.result = await fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY').then(r => r.json());
    }
  }
})