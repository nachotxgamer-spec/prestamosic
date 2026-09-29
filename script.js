import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO_ID",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const loanForm = document.getElementById('loanForm');
const clientList = document.getElementById('clientList');

// Guardar nuevo préstamo
loanForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('clientName').value;
  const amount = parseFloat(document.getElementById('amount').value);
  const interest = parseFloat(document.getElementById('interest').value);
  const installments = parseInt(document.getElementById('installments').value);
  const frequency = document.getElementById('frequency').value;

  const totalToPay = amount + (amount * (interest / 100));
  const installmentValue = totalToPay / installments;

  try {
    await addDoc(collection(db, "loans"), {
      name,
      amount,
      interest,
      installments,
      installmentValue,
      totalToPay,
      paidInstallments: 0,
      remainingAmount: totalToPay,
      frequency,
      createdAt: new Date().toISOString()
    });

    loanForm.reset();
    loadClients();
  } catch (error) {
    console.error("Error al guardar en Firebase: ", error);
  }
});

// Cargar perfiles
async function loadClients() {
  clientList.innerHTML = '<p style="text-align:center; color:#94a3b8;">Cargando perfiles...</p>';
  const querySnapshot = await getDocs(collection(db, "loans"));

  clientList.innerHTML = '';

  if (querySnapshot.empty) {
    clientList.innerHTML = '<p style="text-align:center; color:#94a3b8;">No hay perfiles registrados.</p>';
    return;
  }

  querySnapshot.forEach((document) => {
    const data = document.data();
    const id = document.id;

    const card = document.createElement('div');
    card.className = 'client-card';
    card.innerHTML = `
      <div class="client-header">
        <span class="client-name">${data.name}</span>
        <span class="client-amount">$${data.remainingAmount.toLocaleString('es-AR')} pend.</span>
      </div>
      <div class="client-stats">
        <strong>Monto original:</strong> $${data.amount.toLocaleString('es-AR')} (+${data.interest}% interés)<br>
        <strong>Cuota (${data.frequency}):</strong> $${Math.round(data.installmentValue).toLocaleString('es-AR')}<br>
        <strong>Progreso:</strong> ${data.paidInstallments} de ${data.installments} cuotas pagadas
      </div>
      ${data.paidInstallments < data.installments 
        ? `<button class="btn-pay" onclick="payInstallment('${id}', ${data.paidInstallments},${data.installments}, ${data.installmentValue},${data.remainingAmount})">Registrar Pago de Cuota</button>` 
        : '<div class="completed-badge">¡Préstamo Finalizado!</div>'}
    `;
    clientList.appendChild(card);
  });
}

// Registrar pago
window.payInstallment = async (id, currentPaid, totalInstallments, installmentValue, currentRemaining) => {
  const newPaid = currentPaid + 1;
  const newRemaining = Math.max(0, currentRemaining - installmentValue);

  const loanRef = doc(db, "loans", id);
  await updateDoc(loanRef, {
    paidInstallments: newPaid,
    remainingAmount: newRemaining
  });

  loadClients();
};

// Carga inicial al abrir la página
loadClients();
