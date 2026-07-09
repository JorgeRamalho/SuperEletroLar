/** Estados brasileiros - UF + nome (acentos via Unicode escapes) */
window.BR_STATES = [
  { uf: 'AC', name: 'Acre' },
  { uf: 'AL', name: 'Alagoas' },
  { uf: 'AP', name: 'Amap\u00E1' },
  { uf: 'AM', name: 'Amazonas' },
  { uf: 'BA', name: 'Bahia' },
  { uf: 'CE', name: 'Cear\u00E1' },
  { uf: 'DF', name: 'Distrito Federal' },
  { uf: 'ES', name: 'Esp\u00EDrito Santo' },
  { uf: 'GO', name: 'Goi\u00E1s' },
  { uf: 'MA', name: 'Maranh\u00E3o' },
  { uf: 'MT', name: 'Mato Grosso' },
  { uf: 'MS', name: 'Mato Grosso do Sul' },
  { uf: 'MG', name: 'Minas Gerais' },
  { uf: 'PA', name: 'Par\u00E1' },
  { uf: 'PB', name: 'Para\u00EDba' },
  { uf: 'PR', name: 'Paran\u00E1' },
  { uf: 'PE', name: 'Pernambuco' },
  { uf: 'PI', name: 'Piau\u00ED' },
  { uf: 'RJ', name: 'Rio de Janeiro' },
  { uf: 'RN', name: 'Rio Grande do Norte' },
  { uf: 'RS', name: 'Rio Grande do Sul' },
  { uf: 'RO', name: 'Rond\u00F4nia' },
  { uf: 'RR', name: 'Roraima' },
  { uf: 'SC', name: 'Santa Catarina' },
  { uf: 'SP', name: 'S\u00E3o Paulo' },
  { uf: 'SE', name: 'Sergipe' },
  { uf: 'TO', name: 'Tocantins' },
];

window.fillBrazilianStates = function fillBrazilianStates(selectEl, allLabel = 'Todos os estados') {
  if (!selectEl || selectEl.dataset.statesFilled === '1') return;
  const current = selectEl.value;
  selectEl.innerHTML = `<option value="">${allLabel}</option>`;
  window.BR_STATES.forEach(({ uf, name }) => {
    const opt = document.createElement('option');
    opt.value = uf;
    opt.textContent = `${uf} \u2014 ${name}`;
    selectEl.appendChild(opt);
  });
  if (current) selectEl.value = current;
  selectEl.dataset.statesFilled = '1';
};
