export const showResult = (results, div) => {
  console.log(results, div);

  results.forEach((result, index) => {
    const dice = document.createElement('button');
    dice.id = index;
    dice.textContent = result;
    div.appendChild(dice);
  });
};

copy.addEventListener('click', () => {
  navigator.clipboard.writeText(window.location.href);
  copy.innerText = 'Lien copié !';
  setInterval(() => {
    copy.innerText = "→ Copier le lien d'invitation ←";
  }, 700);
});
