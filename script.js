const firebaseConfig = {
  apiKey: "AIzaSyDiXYfi_iH6RHi7Uyz_u_3oz2oQy3VA7E8",
  authDomain: "mis-prestamos-9ae5d.firebaseapp.com",
  databaseURL: "https://mis-prestamos-9ae5d-default-rtdb.firebaseio.com",
  projectId: "mis-prestamos-9ae5d",
  storageBucket: "mis-prestamos-9ae5d.firebasestorage.app",
  messagingSenderId: "218821257027",
  appId: "1:218821257027:web:a0329e628f99c6f52ff1f6"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();
let clienteActivo = "";

// CREAR PERFIL
window.crearPrestamo = function() {
  const nombre = document.getElementById('nombre').value.trim();
  const capital = parseFloat(document.getElementById('monto').value);
  const porcentaje = parseFloat(document.getElementById('interes_porcentaje').value);
  const cuotas = parseInt(document.getElementById('cuotas').value);
  const fechaIn = document.getElementById('fecha_inicio').value;

  if (nombre && capital && cuotas && fechaIn) {
    const totalADevolver = capital + (capital * (porcentaje / 100));
    const interesMonto = capital * (porcentaje / 100);
    const valorCuota = totalADevolver / cuotas;

    db.ref('clientes/' + nombre).set({
      nombre: nombre,
      dni: document.getElementById('dni').value,
      domicilio: document.getElementById('domicilio').value,
      telefono: document.getElementById('telefono').value,
      capital: capital,
      interesMonto: interesMonto,
      totalADevolver: totalADevolver,
      cuotaDiaria: valorCuota,
      pagado: 0,
      fechaInicio: fechaIn
    }).then(() => {
      alert("¡Perfil de " + nombre + " guardado!");
      location.reload();
    });
  } else {
    alert("Por favor completa todos los campos requeridos.");
  }
};

// ACTUALIZACIÓN DE TABLERO Y LISTA
db.ref('clientes').on('value', (snapshot) => {
  const lista = document.getElementById('lista-clientes');
  let capTotal = 0;
  let intTotal = 0;
  lista.innerHTML = "";

  snapshot.forEach((child) => {
    const c = child.val();
    capTotal += c.capital;
    intTotal += (c.interesMonto || 0);

    const item = document.createElement('div');
    item.className = 'cliente-item';
    item.onclick = () => abrirGlosario(c);
    item.innerHTML = `
      <div>
        <strong>${c.nombre}</strong><br>
        <small style="color:#94a3b8">DNI: ${c.dni}</small>
      </div>
      <div style="text-align:right">
        <span style="color:#10b981">$${(c.totalADevolver - c.pagado).toFixed(0)}</span><br>
        <small style="font-size:10px">RESTA</small>
      </div>
    `;
    lista.appendChild(item);
  });

  document.getElementById('total-capital').innerText = "$" + capTotal.toLocaleString();
  document.getElementById('total-interes').innerText = "$" + intTotal.toLocaleString();
});

// MODAL / GLOSARIO
window.abrirGlosario = function(c) {
  clienteActivo = c.nombre;
  document.getElementById('modal-cliente-nombre').innerText = c.nombre;
  document.getElementById('info-cliente-detalle').innerHTML = `
    🪪 DNI: ${c.dni}<br>
    🏠 Domicilio: ${c.domicilio}<br>
    📞 Teléfono: ${c.telefono}<br>
    🗓️ Fecha Inicio: ${c.fechaInicio}<br>
    💰 Capital Inicial: $${c.capital.toLocaleString()}
  `;
  document.getElementById('cuota-hoy').innerText = "$" + c.cuotaDiaria.toFixed(2);
  document.getElementById('modal-glosario').style.display = "block";
  
  db.ref('historial/' + c.nombre).off(); // Limpiar escucha previa
  db.ref('historial/' + c.nombre).on('value', (snap) => {
    const h = document.getElementById('historial-pagos');
    h.innerHTML = "";
    snap.forEach(p => {
      h.innerHTML += `<li>📅 ${p.val().fecha} — Cobraste: <b>$${p.val().monto}</b></li>`;
    });
  });
};

// REGISTRAR COBRO
window.registrarPago = function() {
  const monto = parseFloat(document.getElementById('monto-pago').value);
  if (!monto) return;
  const ref = db.ref('clientes/' + clienteActivo);
  ref.once('value').then(s => {
    const nuevoPagado = (s.val().pagado || 0) + monto;
    ref.update({ pagado: nuevoPagado });
    db.ref('historial/' + clienteActivo).push({
      monto: monto,
      fecha: new Date().toLocaleDateString()
    });
    document.getElementById('monto-pago').value = "";
    alert("Cobro registrado con éxito");
  });
};

window.eliminarPerfil = function() {
  if (confirm("¿Seguro que quieres borrar a " + clienteActivo + "?")) {
    db.ref('clientes/' + clienteActivo).remove();
    db.ref('historial/' + clienteActivo).remove();
    cerrarModal();
  }
};

window.cerrarModal = () => { document.getElementById('modal-glosario').style.display = "none"; };