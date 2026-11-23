const confirmacao = document.querySelector("dialog.confirmacao");
const abrirConfirmacao = document.querySelector("[data-abrir-confirmacao]");

if (confirmacao && abrirConfirmacao && typeof confirmacao.showModal === "function") {
  document.querySelector("[data-confirmacao-fallback]").hidden = true;
  abrirConfirmacao.hidden = false;
  abrirConfirmacao.addEventListener("click", () => confirmacao.showModal());
  confirmacao.querySelector("[data-fechar-confirmacao]").addEventListener("click", () => confirmacao.close());
  confirmacao.addEventListener("close", () => abrirConfirmacao.focus());
  confirmacao.showModal();
}
