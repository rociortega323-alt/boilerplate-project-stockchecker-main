const jsonOutput = document.getElementById('jsonResult');

document.getElementById('testForm2').addEventListener('submit', e => {
  e.preventDefault();
  const stock = e.target[0].value.trim();
  const like  = e.target[1].checked;

  fetch(`/api/stock-prices?stock=${encodeURIComponent(stock)}&like=${like}`)
    .then(res => res.json())
    .then(data => {
      jsonOutput.innerText = JSON.stringify(data, null, 2);
    });
});

document.getElementById('testForm').addEventListener('submit', e => {
  e.preventDefault();
  const stock1 = e.target[0].value.trim();
  const stock2 = e.target[1].value.trim();
  const like   = e.target[2].checked;

  fetch(`/api/stock-prices?stock=${encodeURIComponent(stock1)}&stock=${encodeURIComponent(stock2)}&like=${like}`)
    .then(res => res.json())
    .then(data => {
      jsonOutput.innerText = JSON.stringify(data, null, 2);
    });
});
