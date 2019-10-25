let fs = require('fs');
let path = require('path');
let md = require('markdown-it')({ typographer: true });
let puppeteer = require('puppeteer');
var implicitFigures = require('markdown-it-implicit-figures');

let line = 28;
let lq = line / 4;
let bf = 5 / 8;
let hf = 6 / 8;

let rfs = bf * line;
let lh = 1 / bf;
let rlh = line;

md.use(require('markdown-it-anchor'));
md.use(require('markdown-it-table-of-contents'), {
  includeLevel: [2, 3, 4],
  containerHeaderHtml: `<div style="display: flex; margin-top: ${lq *
    2}px; margin-bottom: ${lq *
    2}px; font-weight: bold; text-transform: uppercase;">
    <div><button id="toggle_contents" style="padding-left: 1ch; padding-right: 1ch; margin-left: -1ch; margin-right: -1ch; cursor: pointer;">☰</button><span id="contents-label" style="margin-left: 1ch"> Contents</span></div>
  </div>`,
});
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
button {
  font-family: IBM Plex Mono;
}
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
  background: #fff;
  margin-top: ${lq * 2}px;
  margin-bottom: ${lq * 4}px;
}
blockquote {
  margin: 0;
   margin-top: ${lq * 2}px;
  margin-bottom: ${lq * 2}px;
margin-left: 3ch;
}
blockquote + blockquote {
  margin-top: 0;
}
figcaption {
  font-family: IBM Plex Mono;
  margin-top: ${lq * 2}px;
  font-size: ${line * 0.75 * bf}px;
  line-height: ${line * 0.75}px;
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

let sidebar_width = '32ch';

function makeStyle() {
  return `<style type="text/css">
    * {
      box-sizing: border-box;
    }
    html {
      background: #fff;
      font-family: IBM Plex Sans;
      font-size: ${rfs}px;
      line-height: ${lh};
    }
    body {
      margin: 0;
    }
    .content {
      max-width: 64ch;
      padding-left: 2ch;
      padding-right: 2ch;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      padding-bottom: ${line * 1.5}px;
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
    width: ${sidebar_width};
    padding-left: 2ch;
    padding-right: 2ch;
    height: 100vh;
    overflow-y: auto;
  }
  body {
    padding-left: ${sidebar_width};
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
    padding-left: 1ch;
    text-indent: -1ch;
  }
 .table-of-contents > ul > li > ul > li > ul > li {
    font-weight: normal;
    font-style: italic;
    padding-left: 1ch;
    text-indent: -1ch;
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
  .table-of-contents ul li a.active {
    text-decoration: underline; 
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
      link.className = 'active'
    }

    window.addEventListener("load", (event) => {
      let headings = document.querySelectorAll('h2, h3, h4');
      let links = document.querySelectorAll('.table-of-contents ul li a')

      observer = new IntersectionObserver((entry, observer) => {
        if (entry[0].intersectionRatio === 1) {
          for (let link of links) {
            link.className = ''
          }
          let target_id = entry[0].target.getAttribute('id')
          setActive(target_id)
        }
      }, { threshold: 1, rootMargin: "0px 0px -20% 0px" });

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
        let hidden_class = "toc-desktop-hidden"
        if (body.className === hidden_class) {
          body.className = ''
        } else {
          body.className = hidden_class
        }
      })
    }, false);
  </script>`;
}

function makeHead() {
  return `<head>
    <meta charset="utf-8" />
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
          <div style="margin-top: ${line}px;">Cloudera Fast Forward</div>
          ${content}
        </div>
      </body>
    </html>
  `;
}

// let filenames = fs.readdirSync('src');
// let filenames = ['00-frontmatter.md', '03-prototype.md'];
let filenames = ['03-prototype.md'];
let report = '';
for (let f = 0; f < filenames.length; f++) {
  let content = fs.readFileSync('src/' + filenames[f], 'utf-8');
  report += content + `\n`;
}
let html = wrap(md.render(report));
fs.writeFileSync('out/' + 'index.html', html);

let margin = '0.5in';

(async () => {
  let browser = await puppeteer.launch();
  let page = await browser.newPage();
  await page.goto(`file:${path.join(__dirname, 'out/index.html')}`, {
    waitUntil: 'networkidle2',
  });
  await page.pdf({
    path: 'out/book.pdf',
    height: '8.5in',
    width: '5.5in',
    displayHeaderFooter: true,
    margin: {
      top: margin,
      left: margin,
      right: margin,
      bottom: margin,
    },
  });
  await browser.close();
})();
