mdlr('[web]snippets:animated-border', m => {

  m.html`<div>MDLR</div>`;

  m.style`
  color: #fa9a34;
  background-color: #222;
  font-size: 2rem;
  font-weight: bold;

  div {
    width: 200px;
    height: 100px;
    position:relative;
    border-radius: 10px;
    display: grid;
    margin: 100px;
    justify-content: center;
    align-content: center;
    background-color: inherit;
  }

  div::after, div::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: -1;
    background-image: conic-gradient(from calc(var(--angle) + 45deg), #fa9a34, #0000, #0000, #fa9a34, #0000, #0000, #fa9a34);
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    padding: 3px;
    border-radius: 13px;
    box-sizing: content-box;
    animation: 3.1415s spin linear infinite;
  }
    
  div::before {
    filter: blur(1.75rem); 
    opacity: 0.5;
    z-index: -2;
  }`;

  m.global`
  body {
    background-color: black;
  }

  @property --angle {
    syntax: "<angle>"; 
    initial-value: 0deg;
    inherits: false;
  }
    
  @keyframes spin {
    from {
      --angle: 0deg;
    }
    to {
      --angle: 360deg;
    }
  }`;

})