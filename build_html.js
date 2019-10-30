let fs = require('fs-extra');
let path = require('path');
let md = require('markdown-it')({ typographer: true });
var implicitFigures = require('markdown-it-implicit-figures');

let deploy_location = process.argv[2];

let line = 28;
let lq = line / 4;
let bf = 5 / 8;
let hf = 6 / 8;

let rfs = bf * line;
let lh = 1 / bf;
let rlh = line;

// Remember old renderer, if overridden, or proxy to default renderer
var defaultRender =
  md.renderer.rules.link_open ||
  function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

// md.renderer.rules.link_open = function(tokens, idx, options, env, self) {
//   var aIndex = tokens[idx].attrIndex('target');
//   if (aIndex < 0) {
//     tokens[idx].attrPush(['target', '_blank']);
//   } else {
//     tokens[idx].attrs[aIndex][1] = '_blank';
//   }
//   return defaultRender(tokens, idx, options, env, self);
// };

md.use(require('markdown-it-anchor'));
md.use(require('markdown-it-table-of-contents'), {
  includeLevel: [2, 3, 4],
  containerHeaderHtml: `<div id="toc-header" style="display: flex; font-weight: bold; text-transform: uppercase;">
     <div><button id="toggle_contents" style="padding-left: 0.5ch; padding-right: 0.5ch; cursor: pointer; position: relative; top: -1px;">☰</button><span id="contents-label" style="margin-left: 0;"> Contents</span></div>
  </div>`,
});
let custom_container = require('markdown-it-container');
md.use(custom_container, 'info', {});
md.use(require('markdown-it-footnote'));
md.use(implicitFigures, {
  dataType: false, // <figure data-type="image">, default: false
  figcaption: true, // <figcaption>alternative text</figcaption>, default: false
  tabindex: false, // <figure tabindex="1+n">..., default: false
  link: false, // <a href="img.png"><img src="img.png"></a>, default: false
});

let svg = `<svg width="${line}" height="${line}" version="1.1" xmlns="http://www.w3.org/2000/svg">
  <line x1="0" y1="0.5" x2="${line}" y2="0.5" stroke="lightblue" stroke-width="1"/>
  <line x1="0" y1="${lq + 0.5}" x2="${line}" y2="${lq +
  0.5}" stroke="lightblue" stroke-width="1"/>
  <line x1="0" y1="${lq * 2 + 0.5}" x2="${line}" y2="${lq * 2 +
  0.5}" stroke="lightblue" stroke-width="1"/>
  <line x1="0" y1="${lq * 3 + 0.5}" x2="${line}" y2="${lq * 3 +
  0.5}" stroke="lightblue" stroke-width="1"/>
</svg>`;
let buff = new Buffer(svg);
let svg_encoded = buff.toString('base64');

let hcounter = `
h1, h2, h3, h4, h5, h6, button { font-size: inherit; line-height: inherit; font-style: inherit; font-weight: inherit; margin: 0; font-feature-settings: "tnum"; border: none; background: transparent; padding: 0;  }
button:focus, button:hover {
  background: rgba(0,0,0,0.125);
  outline: none;
}
h1 {
  font-size: ${line * 2 * hf}px;
  line-height: ${line * 2}px;
  font-weight: bold;
  margin-top: ${lq * 2}px;
  margin-bottom: ${lq * 2}px;
}
h2 {
  font-size: ${line * 1.5 * hf}px;
  line-height: ${line * 1.5}px;
  font-weight: bold;
  margin-top: ${lq * 2}px;
  margin-bottom: ${lq * 2}px;
}
h3 {
  font-size: ${line * 1.25 * hf}px;
  line-height: ${line * 1.25}px;
  font-weight: bold;
  margin-top: ${lq * 2}px;
  margin-bottom: ${lq * 2}px;
}
h4 {
  font-size: ${line * 1 * hf}px;
  line-height: ${line * 1}px;
  font-weight: bold;
  margin-top: ${lq * 2}px;
  margin-bottom: ${lq * 2}px;
}
h5 {
  font-size: ${line * 1 * bf}px;
  line-height: ${line * 1}px;
  margin-top: ${lq * 2}px;
  margin-bottom: ${lq * 2}px;
  font-weight: bold;
}
h6 {
  font-size: ${line * 1 * bf}px;
  line-height: ${line * 1}px;
  margin-top: ${lq * 2}px;
  margin-bottom: ${lq * 2}px;
  font-style: italic;
}
p {
  margin-bottom: ${lq * 2}px;
}
figure {
  margin: 0;
  margin-top: ${lq * 2}px;
  margin-bottom: ${lq * 4}px;
}
blockquote {
  margin: 0;
   margin-top: ${lq * 2}px;
  margin-bottom: ${lq * 2}px;
margin-left: 2ch;
}
blockquote + blockquote {
  margin-top: 0;
}
figcaption {
  font-family: "Plex Mono", serif, monospace;
  margin-top: ${lq * 2}px;
  font-size: ${line * 0.75 * bf}px;
  line-height: ${line * 0.75}px;
}
.info {
  background: #efefef;
  padding-left: 2ch;
  padding-right: 2ch;
  padding-top: ${lq * 2}px;
  padding-bottom: ${lq * 2}px;
  margin-bottom: ${line}px;
}
.info p:last-child {
  margin-bottom: 0;
}
img {
  display: block;
  max-width: 100%;
  margin: 0 auto;
}
.debug > * {
  outline: solid 1px green;
}
.debug {
  background-position: 0 -0.5; position: absolute; top: 0; left: 0; width: 100%; height: 100000px; background: url('data:image/svg+xml;base64,${svg_encoded}');
}
`;

let sidebar_width = 32;
let content_width = 64;

function makeFonts() {
  return `
  @font-face {
    font-family: 'Plex Mono';
    src: url('fonts/IBMPlexMono-Regular.woff2') format('woff2'),
      url('fonts/IBMPlexMono-Regular.woff') format('woff');
    font-weight: normal;
    font-style: normal;
  }
  @font-face {
    font-family: 'Plex Mono';
    src: url('fonts/IBMPlexMono-Italic.woff2') format('woff2'),
      url('fonts/IBMPlexMono-Italic.woff') format('woff');
    font-weight: normal;
    font-style: italic;
  }
  @font-face {
    font-family: 'Plex Sans';
    src: url('fonts/IBMPlexSans-Regular.woff2') format('woff2'),
      url('fonts/IBMPlexSans-Regular.woff') format('woff');
    font-weight: normal;
    font-style: normal;
  }
  @font-face {
    font-family: 'Plex Sans';
    src: url('fonts/IBMPlexSans-Italic.woff2') format('woff2'),
      url('fonts/IBMPlexSans-Italic.woff') format('woff');
    font-weight: normal;
    font-style: italic;
  }
  @font-face {
    font-family: 'Plex Sans';
    src: url('fonts/IBMPlexSans-Bold.woff2') format('woff2'),
      url('fonts/IBMPlexSans-Bold.woff') format('woff');
    font-weight: bold;
    font-style: normal;
  }
  @font-face {
    font-family: 'Plex Sans';
    src: url('fonts/IBMPlexSans-BoldItalic.woff2') format('woff2'),
      url('fonts/IBMPlexSans-BoldItalic.woff') format('woff');
    font-weight: bold;
    font-style: italic;
  }
  `;
}

function makeStyle() {
  return `<style type="text/css">
    ${makeFonts()}
    * {
      box-sizing: border-box;
    }
    html {
      background: #fff;
      font-family: "Plex Sans", serif, sans-serif;
      font-size: ${line * bf}px;
      line-height: ${line}px;
    }
    body {
      margin: 0;
    }
    .content {
      max-width: ${content_width}ch;
      padding-left: 2ch;
      padding-right: 2ch;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      padding-bottom: ${line * 0}px;
    }
   p, ul, ol {
      margin: 0;
    }
    ul, ol {
      padding-left: 3ch;
    }
  p {
   // text-indent: 3ch;
}
    li p:first-child {
      text-indent: 0;
    }
 
   hr {
      margin: 0;
      border-top-color: black;
      margin-top: -0.5px;
      margin-bottom: ${rlh - 0.5}px;
    }
  ${hcounter}
  a {
    color: inherit;
  }
  .table-of-contents {
    background: #efefef;
    position: fixed;
    left: 0;
    top: 0;
    width: ${sidebar_width}ch;
    height: 100vh;
    overflow-y: auto;
    background: #efefef;
      // background: rgba(230,230,230,0.85);
      //   backdrop-filter: blur(5px);
  }
  body {
    padding-left: ${sidebar_width}ch;
  }
  p:empty {
    display: none;
  }

 .table-of-contents ul {
    list-style: none;
    padding-left: 0
  }
 .table-of-contents > ul > li {
    font-weight: bold;
  }
 .table-of-contents > ul > li > ul > li {
    font-weight: normal;
    font-style: normal;
    text-transform: none;
    letter-spacing: 0;
  }
 .table-of-contents > ul > li > ul > li > ul > li {
    font-weight: normal;
    font-style: italic;
  }
 .table-of-contents a {
    text-decoration: none;
  }
  .table-of-contents a:hover {
    text-decoration: underline;
  }
 sup {
    display: none;
  }
  .table-of-contents ul a {
    display: block;
    padding-left: 3ch;
    text-indent: -1ch;
    padding-right: 2ch;
  }
  .table-of-contents ul li a.active {
    position: relative;
    background: #ddd;
    // text-decoration: line-through;
  }

  .table-of-contents ul li a.active:before {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    content: "";
    width: 1ch;
    background: rgb(255, 198, 91);
    background: #666;
    display: none;
  }
  .table-of-contents > ul > li > ul > li > a {
    padding-left: 4ch;
  }
  .table-of-contents > ul > li > ul > li > ul > li > a {
    padding-left: 5ch;
  }



  .toc-desktop-hidden .table-of-contents {
    width: auto;
  }
  .toc-desktop-hidden #contents-label {
    display: none;
  }
  .toc-desktop-hidden .table-of-contents ul {
    display: none;
  }
  body.toc-desktop-hidden {
    padding-left: 5ch;
  }
  body:before {
    content: " ";
    height: ${line}px;
    width: 96ch;
    background: black;
    position: absolute;
    left: 0;
    top: 0;
    z-index: 999;
    display: none;
  }
    #toc-header {
      margin-top: ${lq * 2}px;
      margin-bottom: ${lq * 2}px;
      margin-left: 1ch;
      margin-right: 1ch;
    }
 
  @media screen and (max-width: 1028px) {
    h1 {
      font-size: ${line * 1.75 * hf}px;
      line-height: ${line * 1.75}px;
      font-weight: bold;
      margin-top: ${lq * 2}px;
      margin-bottom: ${lq * 2}px;
    }
    .table-of-contents ul li {
      padding-top: ${lq / 2}px;
      padding-bottom: ${lq / 2}px;
    }

    #toc-header {
      margin-top: ${lq}px;
      margin-bottom: ${lq}px;
    }
 
    body {
      padding-left: 0;
      padding-top: ${lq * 6}px;
    }
    #contents-label {
      display: none;
    }
    .table-of-contents {
      height: auto;
      width: 100%;
      z-index: 3;
    }
  body.toc-mobile-show .content:before {
      content: "";
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      right: 0;
      background: rgba(0,0,0,0.25);
      z-index: 2;
      border-top: solid ${line * 1.5}px #aaa;
    }
 
    .table-of-contents > ul {
      display: none;
    }
   body.toc-mobile-show {
      overflow: hidden;
    }
    body.toc-mobile-show #toc-header {
      margin-top: ${lq * 1}px;
      margin-bottom: ${lq * 1}px;
      position: relative;
    }
    body.toc-mobile-show .table-of-contents {
      width: ${sidebar_width}ch;
      height: 100vh;
      max-width: calc(100% - 4ch);
      overflow: auto;
    }
   body.toc-mobile-show .table-of-contents > ul {
      display: block;
      padding-bottom: ${line * 1}px;
      position: relative;
    }
    body.toc-mobile-show #contents-label {
      display: inline;
      position: relative;
    }
  }
}
</style>`;
}

function makeJS() {
  return `<script>
    function inViewport(elem) {
      let bounding = elem.getBoundingClientRect();
      return (
        bounding.top >= 0 &&
        bounding.left >= 0 &&
        bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        bounding.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    };

    function setActive(target_id) {
      let selector = '.table-of-contents ul li a[href="#' + target_id + '"]'
      let link = document.querySelector(selector)
      if (link !== null) {
        link.className = 'active'
      }
    }

    window.addEventListener("load", (event) => {
      let headings = document.querySelectorAll('h1, h2, h3, h4');
      let links = document.querySelectorAll('.table-of-contents ul li a')

      observer = new IntersectionObserver((entry, observer) => {
        if (entry[0].intersectionRatio === 1) {
          for (let link of links) {
            link.className = ''
          }
          let target_id = entry[0].target.getAttribute('id')
          setActive(target_id)
        }
      }, { threshold: 1, rootMargin: "0px 0px -50% 0px" });

      let first = true
      for (let heading of headings) {
        if (first && inViewport(heading)) {
          setActive(heading.getAttribute('id'))
          first = false
        }
        observer.observe(heading);
      }

      document.querySelector('#toggle_contents').addEventListener('click', () => {
        let body = document.body
        if (window.innerWidth > 1027) {
          let hidden_class = "toc-desktop-hidden"
          if (body.className === hidden_class) {
            body.className = ''
          } else {
            body.className = hidden_class
          }
        } else {
          let show_class = "toc-mobile-show"
          if (body.className === show_class) {
            body.className = ''
          } else {
            body.className = show_class
          }
        }
      })

      for (let link of links) {
        link.addEventListener('click', (e) => {
          let href = e.target.getAttribute('href')
          let elem = document.querySelector(href)
          window.scroll({
            top: elem.offsetTop - ${line},
            left: 0,
            behavior: 'smooth'
          })
          if (window.innerWidth < 1028) {
            document.body.className = ''
          }
          e.preventDefault() 
        })
      }

      document.querySelector('.content').addEventListener('click', () => {
        if (window.innerWidth < 1028) {
          document.body.className = ''
        }
      })
      document.querySelector('.table-of-contents').addEventListener('click', (e) => {
        e.stopPropagation()
      })

      let mediaQueryList = window.matchMedia("(max-width: 1028px)");
      function handleBreakpoint(mql) {
        // clear any left over toggle classes
        document.body.className = ''
      }
      mediaQueryList.addListener(handleBreakpoint);
    }, false);
  </script>`;
}

function makeHead() {
  let title = 'Textflix: Using Transfer Learning for an NLP Prototype';
  let description =
    'Learn how we created a sentiment analyzer for movie reviews using pretrained BERT word embeddings and LIME for interpretability.';
  return `<head>
    <meta charset="utf-8" />

    <title>${title}</title>
    <meta name="description" content="${description}" />

    <meta property="og:title" content="${title}" /> 
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="https://experiments.fastforwardlabs.com/log/textflix-report/textflix-report-share.png" />
    <meta property="og:url" content="https://experiments.fastforwardlabs.com/log/textflix-report" />
    <meta name="twitter:card" content="summary_large_image" />
    
    <meta name="viewport" content="width=device-width" />
    <link rel="icon" type="image/x-icon" href="/static/images/favicon.png" />
    
    ${makeStyle()}
    ${makeJS()}
  </head>`;
}

function wrap(content) {
  return `<!DOCTYPE html>
    <html lang="en">
      ${makeHead()}
      <body>
        <div class="content nodebug" style="position: relative;">
          <div style="margin-top: ${line}px;"><a href="https://experiments.fastforwardlabs.com" >Cloudera Fast Forward</a></div>
          ${content}
        </div>
      </body>
    </html>
  `;
}

let filenames = fs.readdirSync(path.join(__dirname, 'src'));
// let filenames = ['00-frontmatter.md', '03-prototype.md'];
let report = '';
for (let f = 0; f < filenames.length; f++) {
  let content = fs.readFileSync(
    path.join(__dirname, 'src/') + filenames[f],
    'utf-8'
  );
  report += content + `\n`;
}
let html = wrap(md.render(report));

let write_index_to = path.join(__dirname, 'out/');
if (deploy_location === 'exp') {
  fs.mkdir(path.join(__dirname, 'exp'));
  fs.copySync(path.join(__dirname, 'out'), path.join(__dirname, 'exp'));
  write_index_to = path.join(__dirname, 'exp/');
}

fs.writeFileSync(write_index_to + 'index.html', html);

let margin = '0.5in';

// turned off for now (function not called)
// async () => {
//   let browser = await puppeteer.launch();
//   let page = await browser.newPage();
//   await page.goto(`file:${path.join(__dirname, 'out/index.html')}`, {
//     waitUntil: 'networkidle2',
//   });
//   await page.pdf({
//     path: 'out/book.pdf',
//     height: '8.5in',
//     width: '5.5in',
//     displayHeaderFooter: true,
//     margin: {
//       top: margin,
//       left: margin,
//       right: margin,
//       bottom: margin,
//     },
//   });
//   await browser.close();
// }();
