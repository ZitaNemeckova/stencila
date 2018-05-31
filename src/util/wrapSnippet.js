export default function (SNIPPET) {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body>
    <main>
      <div id="data" data-format="html">
        <div class="content">${SNIPPET}</div>
      </div>
    </main>
  </body>
</html>
`
}
