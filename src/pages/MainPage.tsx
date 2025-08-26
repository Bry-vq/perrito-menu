import React, { useMemo, useState, useRef, useEffect } from "react";

/**
 * Landing: Menu para armar carrito y enviar pedido por WhatsApp
 * - Sin dependencias extra (solo React + Tailwind)
 * - Cambia BUSINESS_NUMBER por tu número en formato E.164 (Colombia: 57XXXXXXXXXX, sin "+")
 */

const BUSINESS_NUMBER = "573224207925"; // <-- REEMPLAZA

const SAUSAGE_OPTIONS = [
  { quantity: 2, price: 7500 },
  { quantity: 3, price: 8000 },
  { quantity: 4, price: 8500 },
  { quantity: 5, price: 9000 },
  { quantity: 6, price: 9500 },
];

const RELLENO = ["Cebolla", "Papita", "Queso", "Huevo de codorniz"];
const SALSAS = ["Mayonesa", "Mostaza", "Tomate", "Piña"];

const BEBIDAS = [
  { id: "b-agua300", name: "Agua 300ml", price: 2000 },
  { id: "b-coca400", name: "CocaCola Pet 400ml", price: 3500 },
  { id: "b-coca15", name: "CocaCola 1.5L", price: 7000 },
];

const ADICIONALES = [
  { id: "a-huevo", name: "Porción de huevo (5 codorniz)", price: 2000 },
];

const fmt = (n) => new Intl.NumberFormat("es-CO").format(n);
const cleanPhone = (s) => s.replace(/\D/g, "").slice(-10);

export default function MainPage() {
  // Cliente
  const [deliveryType, setDeliveryType] = useState("Domicilio"); // "En sitio" | "Para llevar" | "Domicilio" | "Recoge en tienda"
  const [deliveryBranch, setDeliveryBranch] = useState("Libertadores"); // "Libertadores" | "Torcoroma"
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });

  // Builder de perrito
  const [sausages, setSausages] = useState(null); // 2..6
  const [withoutToppings, setWithoutToppings] = useState([]); // Relleno a quitar
  const [withoutSauces, setWithoutSauces] = useState([]); // Salsas a quitar
  const [comment, setComment] = useState("");

  // Carrito
  const [cart, setCart] = useState([]); // {id, type, name, unitPrice, quantity, description}
  const [cartBump, setCartBump] = useState(false);
  const cartRef = useRef<HTMLDivElement>(null);

  const total = useMemo(
    () => cart.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0),
    [cart]
  );

  const requireFields = deliveryType === "Domicilio" || deliveryType === "Recoge en tienda";

  const handleCartBump = () => {
    setCartBump(true);
    setTimeout(() => setCartBump(false), 400);
  };

  const addPerrito = () => {
    if (!sausages) return;
    const opt = SAUSAGE_OPTIONS.find((o) => o.quantity === sausages);
    if (!opt) return;

    const descParts = [];
    if (withoutToppings.length) descParts.push(...withoutToppings.map((r) => `sin ${r.toLowerCase()}`));
    if (withoutSauces.length) descParts.push(...withoutSauces.map((s) => `sin ${s.toLowerCase()}`));
    if (comment.trim()) descParts.push(`nota: ${comment.trim()}`);

    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: "perrito",
      name: `Perrito ${sausages} salchichas`,
      unitPrice: opt.price,
      quantity: 1,
      description: descParts.join(", ") || "Con todo",
    };

    setCart((prev) => [...prev, item]);
    handleCartBump(); // <-- aquí
    // Reset del builder
    setSausages(null);
    setWithoutToppings([]);
    setWithoutSauces([]);
    setComment("");
  };

  const addSimple = (prod, type) => {
    const idx = cart.findIndex((i) => i.type === type && i.name === prod.name);
    if (idx >= 0) {
      const clone = [...cart];
      clone[idx].quantity += 1;
      setCart(clone);
    } else {
      setCart((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type,
          name: prod.name,
          unitPrice: prod.price,
          quantity: 1,
          description: "",
        },
      ]);
    }
  };

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (id) => setCart((prev) => prev.filter((i) => i.id !== id));

  const clearCart = () => setCart([]);

  const toggleList = (val, list, setList) => {
    setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);
  };

  const sendWhatsApp = () => {
    if (!cart.length) {
      alert("Tu carrito está vacío");
      return;
    }

    if (requireFields) {
      if (!customer.name.trim()) return alert("Ingresa el nombre del cliente");
      if (!customer.phone.trim()) return alert("Ingresa el teléfono del cliente");
      if (deliveryType === "Domicilio" && !customer.address.trim())
        return alert("Ingresa la dirección para domicilio");
    }

    const phone10 = cleanPhone(customer.phone);
    const now = new Date();
    const fecha = now.toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });

    const lines = cart.map((i) => `• ${i.quantity} x ${i.name}${i.description ? ` (${i.description})` : ""} — $${fmt(i.unitPrice * i.quantity)}`);

    const head = `*Nuevo pedido - Perrito*\nFecha: ${fecha}`;
    const cliente = customer.name || customer.phone ? `\n\n*Cliente:* ${customer.name || "-"}${phone10 ? ` (📱 ${phone10})` : ""}` : "";
    const direccion = deliveryType === "Domicilio" && customer.address ? `\n*Dirección:* ${customer.address}` : "";
    const entrega = `\n*Entrega:* ${deliveryType}`;

    const body = `\n\n*Pedido*\n${lines.join("\n")}\n\n*Total:* $${fmt(total)}`;

    const message = `${head}${cliente}${direccion}${entrega}${body}`;
    const url = `https://wa.me/${BUSINESS_NUMBER}?text=${encodeURIComponent(message)}`;

    const w = window.open(url, "_blank");
    if (!w) window.location.href = url;
  };

  useEffect(() => {
    if (cart.length > 0) {
      setCartBump(true);
      const timer = setTimeout(() => setCartBump(false), 400);
      return () => clearTimeout(timer);
    }
  }, [cart.length]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Carrito flotante SOLO si hay productos */}
      {cart.length > 0 && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => {
              cartRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
            className={`relative bg-white shadow-lg rounded-full w-14 h-14 flex items-center justify-center border-2 border-emerald-600 transition-transform text-3xl animate-heartbeat`}
            aria-label="Ir al carrito"
          >
            🛒
            <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
              {cart.length}
            </span>
          </button>
        </div>
      )}
      <header className="bg-white/70 sticky top-0 z-20 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Perrito <span className="text-emerald-600">— Arma tu pedido</span>
          </h1>
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">{cart.length} ítem(s)</span>
            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold">Total $ {fmt(total)}</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna izquierda: Menú */}
        <section className="space-y-6">
          {/* Tipo de entrega y sede distribuidos */}
          <div className="md:flex md:gap-6">
            {/* Tipo de entrega */}
            <div className="bg-white rounded-2xl shadow p-4 md:p-6 md:w-1/2 mb-4 md:mb-0">
              <h2 className="text-xl font-bold mb-3">🚚 Tipo de entrega</h2>
              <div className="flex flex-wrap gap-2">
                {["Domicilio", "Recoge en tienda"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setDeliveryType(opt)}
                    className={`px-3 py-2 rounded-full border text-sm font-semibold transition ${
                      deliveryType === opt
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            {/* Sede */}
            <div className="bg-white rounded-2xl shadow p-4 md:p-6 md:w-1/2">
              <h2 className="text-xl font-bold mb-3">📍 Sede</h2>
              <div className="flex flex-wrap gap-2">
                {["Libertadores", "Torcoroma"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setDeliveryBranch(opt)}
                    className={`px-3 py-2 rounded-full border text-sm font-semibold transition ${
                      deliveryBranch === opt
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Datos del cliente */}
          <div className="bg-white rounded-2xl shadow p-4 md:p-6">
            <h2 className="text-xl font-bold mb-3">👤 Datos del cliente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre {requireFields && <span className="text-red-500">*</span>}</label>
                <input
                  className="w-full rounded-xl border-2 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  placeholder="Ej: Juan Pérez"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Teléfono {requireFields && <span className="text-red-500">*</span>}</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  className="w-full rounded-xl border-2 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  placeholder="3001234567"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: cleanPhone(e.target.value) })}
                />
              </div>
              {deliveryType === "Domicilio" && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Dirección {requireFields && <span className="text-red-500">*</span>}</label>
                  <input
                    className="w-full rounded-xl border-2 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    placeholder="Ej: Calle 123 #45-67, Barrio XYZ"
                    value={customer.address}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Builder de Perrito */}
          <div className="bg-white rounded-2xl shadow p-4 md:p-6">
            <h2 className="text-xl font-bold mb-4">🌭 Arma tu Perrito</h2>

            {/* Cantidad de salchichas */}
            <h3 className="font-semibold mb-2">Cantidad de salchichas</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {SAUSAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.quantity}
                  onClick={() => setSausages(opt.quantity)}
                  className={`px-4 py-2 rounded-full border text-sm font-semibold transition ${
                    sausages === opt.quantity
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                  }`}
                >
                  {opt.quantity} salch — $ {fmt(opt.price)}
                </button>
              ))}
            </div>

            {/* Relleno & Salsas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                {/* Comentario para toppings */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Relleno</h3>
                  <button
                    className="text-xs text-emerald-700 hover:underline"
                    onClick={() => setWithoutToppings(RELLENO)}
                  >
                    Sin Relleno
                  </button>
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  Selecciona los ingredientes que <b>no</b> quieres en tu perrito.
                </div>
                <div className="flex flex-wrap gap-2">
                  {RELLENO.map((r) => {
                    const isOn = withoutToppings.includes(r);
                    return (
                      <button
                        key={r}
                        onClick={() => toggleList(r, withoutToppings, setWithoutToppings)}
                        className={`px-3 py-1 rounded-full text-sm border transition ${
                          isOn ? "bg-red-500 text-white border-red-500" : "bg-white hover:bg-gray-50 border-gray-300"
                        }`}
                      >
                        {isOn ? "Sin " : "Sin "}{r}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Salsas</h3>
                  <button
                    className="text-xs text-emerald-700 hover:underline"
                    onClick={() => setWithoutSauces(SALSAS)}
                  >
                    Sin Salsas
                  </button>
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  Selecciona las salsas que <b>no</b> quieres.
                </div>
                <div className="flex flex-wrap gap-2">
                  {SALSAS.map((s) => {
                    const isOn = withoutSauces.includes(s);
                    return (
                      <button
                        key={s}
                        onClick={() => toggleList(s, withoutSauces, setWithoutSauces)}
                        className={`px-3 py-1 rounded-full text-sm border transition ${
                          isOn ? "bg-red-500 text-white border-red-500" : "bg-white hover:bg-gray-50 border-gray-300"
                        }`}
                      >
                        {isOn ? "Sin " : "Sin "}{s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Comentario */}
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Comentarios</label>
              <textarea
                className="w-full rounded-xl border-2 px-3 py-2 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-emerald-300"
                placeholder="Ej: Poca salsa, extra cebolla, sin piña..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={addPerrito}
                disabled={!sausages}
                className={`px-4 py-2 rounded-xl font-bold shadow transition ${
                  sausages ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-gray-300 text-gray-600 cursor-not-allowed"
                }`}
              >
                ➕ Agregar Perrito
              </button>
              <button
                onClick={() => {
                  setWithoutToppings([]);
                  setWithoutSauces([]);
                }}
                className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50"
              >
                Con todo
              </button>
            </div>
          </div>

          {/* Bebidas */}
          <div className="bg-white rounded-2xl shadow p-4 md:p-6">
            <h2 className="text-xl font-bold mb-4">🥤 Bebidas</h2>
            <div className="flex flex-wrap gap-3">
              {BEBIDAS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => addSimple(b, "bebida")}
                  className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 shadow text-left"
                >
                  <div className="font-semibold">{b.name}</div>
                  <div className="text-sm text-gray-600">$ {fmt(b.price)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Adicionales */}
          <div className="bg-white rounded-2xl shadow p-4 md:p-6">
            <h2 className="text-xl font-bold mb-4">🍮 Adicionales</h2>
            <div className="flex flex-wrap gap-3">
              {ADICIONALES.map((a) => (
                <button
                  key={a.id}
                  onClick={() => addSimple(a, "adicional")}
                  className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 shadow text-left"
                >
                  <div className="font-semibold">{a.name}</div>
                  <div className="text-sm text-gray-600">$ {fmt(a.price)}</div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Columna derecha: Carrito */}
        <aside ref={cartRef} className="bg-white rounded-2xl shadow p-4 md:p-6 h-fit sticky top-20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">🛒 Tu Carrito</h2>
            <button onClick={clearCart} className="text-sm text-red-600 hover:underline">Vaciar</button>
          </div>

          {cart.length === 0 ? (
            <p className="text-gray-500">Aún no agregas productos.</p>
          ) : (
            <ul className="divide-y">
              {cart.map((i) => (
                <li key={i.id} className="py-3 flex items-start gap-3">
                  <div className="flex-1">
                    <div className="font-semibold">{i.name}</div>
                    {i.description && <div className="text-sm text-gray-500">{i.description}</div>}
                    <div className="text-sm text-gray-600 mt-1">Unit: $ {fmt(i.unitPrice)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="w-8 h-8 grid place-items-center rounded-full border hover:bg-gray-50"
                      onClick={() => updateQty(i.id, -1)}
                      aria-label="Restar"
                    >-
                    </button>
                    <span className="w-8 text-center font-semibold">{i.quantity}</span>
                    <button
                      className="w-8 h-8 grid place-items-center rounded-full border hover:bg-gray-50"
                      onClick={() => updateQty(i.id, 1)}
                      aria-label="Sumar"
                    >+
                    </button>
                    <button
                      className="w-8 h-8 grid place-items-center rounded-full border text-red-600 hover:bg-red-50"
                      onClick={() => removeItem(i.id)}
                      aria-label="Eliminar"
                    >×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex items-center justify-between text-lg font-bold">
            <span>Total</span>
            <span>$ {fmt(total)}</span>
          </div>

          <button
            onClick={sendWhatsApp}
            disabled={!cart.length}
            className={`mt-4 w-full px-4 py-3 rounded-2xl font-bold shadow transition flex items-center justify-center gap-2 ${
              cart.length ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-gray-300 text-gray-600 cursor-not-allowed"
            }`}
          >
            Enviar pedido por WhatsApp
          </button>

          <p className="text-xs text-gray-500 mt-2">Al hacer clic se abrirá WhatsApp y el pedido prellenado.</p>
        </aside>
      </main>

      <footer className="py-8 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Perrito — Hecho con ❤️
      </footer>
    </div>
  );
}
