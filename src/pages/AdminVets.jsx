import { useEffect, useState } from "react";
import veterinariansService from "../services/veterinariansService";

const AdminVets = () => {
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    gimimo_data: "",
    pareigos: "",
    el_pastas: "",
    kaina: "",
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await veterinariansService.getAll();
      setVets(res.success ? res.data || [] : mockVets());
    } catch {
      setVets(mockVets());
    } finally {
      setLoading(false);
    }
  };

  const mockVets = () => [
    {
      id: 1,
      gimimo_data: "1985-05-15",
      pareigos: "Chirurgas",
      el_pastas: "vet1@email.com",
      kaina: 50.0,
    },
    {
      id: 2,
      gimimo_data: "1990-03-22",
      pareigos: "Kardiologas",
      el_pastas: "vet2@email.com",
      kaina: 60.0,
    },
  ];

  const startCreate = () => {
    setEditingId(null);
    setForm({
      gimimo_data: "",
      pareigos: "",
      el_pastas: "",
      kaina: "",
    });
    setShowForm(true);
  };
  const startEdit = (v) => {
    setEditingId(v.id);
    setForm({ ...v });
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await veterinariansService.update(editingId, form);
        if (res.success) {
          setVets(
            vets.map((v) =>
              v.id === editingId ? { ...form, id: editingId } : v
            )
          );
        }
      } else {
        const res = await veterinariansService.create(form);
        const created = res.success
          ? res.data || { ...form, id: (vets[vets.length - 1]?.id || 0) + 1 }
          : { ...form, id: (vets[vets.length - 1]?.id || 0) + 1 };
        setVets([...vets, created]);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({
        gimimo_data: "",
        pareigos: "",
        el_pastas: "",
        kaina: "",
      });
    } catch {}
  };

  const removeVet = async (id) => {
    if (!window.confirm("Pašalinti veterinarą?")) return;
    try {
      const res = await veterinariansService.remove(id);
      if (res.success || true) setVets(vets.filter((v) => v.id !== id));
    } catch {}
  };

  if (loading) return <div>Kraunama...</div>;

  return (
    <div>
      <div className="pets-header">
        <h3>Veterinarai</h3>
        <button className="btn primary" onClick={startCreate}>
          + Pridėti
        </button>
      </div>

      {vets.length === 0 ? (
        <div className="empty-state">
          <p>Veterinarų nėra</p>
        </div>
      ) : (
        <div className="pets-grid">
          {vets.map((v) => (
            <div key={v.id} className="pet-card">
              <div className="pet-card-header">
                <div className="pet-avatar">🩺</div>
                <div className="pet-info">
                  <h4>{v.el_pastas}</h4>
                  <p>{v.pareigos}</p>
                </div>
              </div>
              <div className="pet-details">
                <div className="detail-row">
                  <span className="label">Gimimo data:</span>
                  <span>{v.gimimo_data}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Kaina:</span>
                  <span>{v.kaina} €</span>
                </div>
              </div>
              <div className="pet-actions">
                <button
                  className="btn secondary small"
                  onClick={() => startEdit(v)}
                >
                  Redaguoti
                </button>
                <button
                  className="btn danger small"
                  onClick={() => removeVet(v.id)}
                >
                  Šalinti
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {editingId ? "Redaguoti veterinarą" : "Pridėti veterinarą"}
              </h3>
              <button className="close-btn" onClick={() => setShowForm(false)}>
                ×
              </button>
            </div>
            <form className="pet-form" onSubmit={save}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Gimimo data*</label>
                  <input
                    type="date"
                    required
                    value={form.gimimo_data}
                    onChange={(e) =>
                      setForm({ ...form, gimimo_data: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Pareigos*</label>
                  <input
                    required
                    value={form.pareigos}
                    onChange={(e) =>
                      setForm({ ...form, pareigos: e.target.value })
                    }
                    placeholder="Pvz.: Chirurgas"
                  />
                </div>
                <div className="form-group">
                  <label>El. paštas*</label>
                  <input
                    type="email"
                    required
                    value={form.el_pastas}
                    onChange={(e) =>
                      setForm({ ...form, el_pastas: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Kaina (€)*</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.kaina}
                    onChange={(e) =>
                      setForm({ ...form, kaina: e.target.value })
                    }
                    placeholder="50.00"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setShowForm(false)}
                >
                  Atšaukti
                </button>
                <button type="submit" className="btn primary">
                  Išsaugoti
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVets;
