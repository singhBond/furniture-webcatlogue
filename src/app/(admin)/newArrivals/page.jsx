"use client";

import { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  getDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, Trash2, ChevronDown, ChevronUp } from "lucide-react";

export default function AdminCatalogPage() {
  /* ---------- STATE ---------- */
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState({});
  const [selectedCat, setSelectedCat] = useState("");
  const [newCat, setNewCat] = useState("");
  const [filterId, setFilterId] = useState("");
  const [form, setForm] = useState({
    name: "",
    dimension: "",
    units: "",
    mrp: "",
    offerPrice: "",
    description: "",
    files: [],
  });
  const [previews, setPreviews] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openCats, setOpenCats] = useState({}); // accordion state

  /* ---------- REAL-TIME LISTEN ---------- */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "categories"), (snap) => {
      const cats = [];
      const prods = {};

      snap.forEach((d) => {
        const id = d.id;
        cats.push(id);
        prods[id] = d.data().products || [];
      });

      setCategories(cats);
      setSelectedCat(cats[0] || "");
      setProducts(prods);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* ---------- CATEGORY CRUD ---------- */
  const addCategory = async () => {
    const name = newCat.trim().toUpperCase();
    if (!name || categories.includes(name)) {
      alert("Invalid or duplicate category");
      return;
    }
    try {
      await setDoc(doc(db, "categories", name), { products: [] });
      setNewCat("");
    } catch (e) {
      alert("Failed to add category");
    }
  };

  const deleteCategory = async (cat) => {
    if (!confirm(`Delete category "${cat}" and all its products?`)) return;
    try {
      await deleteDoc(doc(db, "categories", cat));
    } catch (e) {
      alert("Failed to delete category");
    }
  };

  /* ---------- IMAGE HELPERS ---------- */
  const compressImage = (file) =>
    new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          let { width, height } = img;
          const max = 800;

          if (width > height && width > max) {
            width = max;
            height = img.height * (max / img.width);
          } else if (height > max) {
            height = max;
            width = img.width * (max / img.height);
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              const compressed = new File([blob], file.name, {
                type: "image/jpeg",
              });
              resolve(compressed);
            },
            "image/jpeg",
            0.8
          );
        };
      };
      reader.readAsDataURL(file);
    });

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const compressed = await Promise.all(files.map(compressImage));
    const base64 = await Promise.all(compressed.map(fileToBase64));

    setForm((f) => ({ ...f, files: [...f.files, ...compressed] }));
    setPreviews((p) => [...p, ...base64]);
  };

  const removeImage = (idx) => {
    setPreviews((p) => p.filter((_, i) => i !== idx));
    setForm((f) => ({ ...f, files: f.files.filter((_, i) => i !== idx) }));
  };

  /* ---------- PRODUCT CRUD ---------- */
  const saveProduct = async () => {
    const { name, dimension, units, mrp, offerPrice, description } = form;
    if (!name || !dimension || !units || !mrp || !selectedCat) {
      alert("Name, Dimension, Units, MRP and Category are required");
      return;
    }

    try {
      const images = previews.length ? previews : [];

      const productData = {
        name: name.trim(),
        dimension: dimension.trim(),
        units: units.trim(),
        mrp: +mrp,
        offerPrice: offerPrice ? +offerPrice : null,
        description: description.trim(),
        images,
      };

      const catRef = doc(db, "categories", selectedCat);
      const snap = await getDoc(catRef);
      const existing = snap.data()?.products || [];

      let updated;
      if (editing) {
        updated = existing.map((p) =>
          p.id === editing ? { ...p, ...productData } : p
        );
      } else {
        // === UNIQUE ID ACROSS ALL CATEGORIES STARTING FROM 101 ===
        let maxId = 100;
        Object.values(products).forEach((catProducts) => {
          catProducts.forEach((p) => {
            if (p.id > maxId) maxId = p.id;
          });
        });
        const nextId = maxId + 1;
        updated = [...existing, { id: nextId, ...productData }];
      }

      await setDoc(
        catRef,
        { products: updated, updatedAt: serverTimestamp() },
        { merge: true }
      );

      resetForm();
    } catch (e) {
      console.error(e);
      alert("Save failed");
    }
  };

  const deleteProduct = async (cat, id) => {
    if (!confirm("Delete this product?")) return;
    const catRef = doc(db, "categories", cat);
    const snap = await getDoc(catRef);
    const prods = snap.data()?.products || [];
    await setDoc(
      catRef,
      {
        products: prods.filter((p) => p.id !== id),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  const startEdit = (cat, p) => {
    setSelectedCat(cat);
    setEditing(p.id);
    setForm({
      name: p.name,
      dimension: p.dimension,
      units: p.units,
      mrp: p.mrp,
      offerPrice: p.offerPrice || "",
      description: p.description || "",
      files: [],
    });
    setPreviews(p.images || []);
  };

  const resetForm = () => {
    setForm({
      name: "",
      dimension: "",
      units: "",
      mrp: "",
      offerPrice: "",
      description: "",
      files: [],
    });
    setPreviews([]);
    setEditing(null);
  };

  /* ---------- FILTERED PRODUCTS ---------- */
  const filteredProducts = useMemo(() => {
    if (!filterId) return products;

    const id = Number(filterId);
    if (Number.isNaN(id)) return {};

    const result = {};
    Object.entries(products).forEach(([cat, list]) => {
      const matches = list.filter((p) => p.id === id);
      if (matches.length) result[cat] = matches;
    });
    return result;
  }, [products, filterId]);

  /* ---------- TOGGLE ACCORDION ---------- */
  const toggleCat = (cat) => {
    setOpenCats((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  /* ---------- UI ---------- */
  if (loading) {
    return <div className="p-8 text-center">Loading…</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-amber-700">Catalog Admin</h1>

      {/* ---- Add Category ---- */}
      <div className="flex gap-3 items-center">
        <Input
          placeholder="New Category (e.g., SOFAS)"
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={addCategory} className="bg-teal-600 hover:bg-teal-700">
          Add Category
        </Button>
      </div>

      {/* ---- Global ID Filter ---- */}
      <div className="flex gap-3 items-center">
        <Label className="whitespace-nowrap">Filter by ID:</Label>
        <Input
          type="number"
          placeholder="e.g., 101"
          value={filterId}
          onChange={(e) => setFilterId(e.target.value)}
          className="max-w-xs"
        />
        {filterId && (
          <Button variant="ghost" onClick={() => setFilterId("")}>
            Clear
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* ---- FORM ---- */}
        <div className="border rounded-xl p-6 bg-amber-50 space-y-4">
          <h2 className="text-xl font-semibold">
            {editing ? "Edit" : "Add"} Product
          </h2>

          {/* Category selector with delete */}
          <div>
            <Label>Category</Label>
            <Select value={selectedCat} onValueChange={setSelectedCat}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c} className="flex items-center justify-between">
                    <span>{c}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCategory(c);
                      }}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Royal Sofa"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Dimension</Label>
              <Input
                value={form.dimension}
                onChange={(e) => setForm({ ...form, dimension: e.target.value })}
                placeholder="6x3x2.5"
              />
            </div>
            <div>
              <Label>Units</Label>
              <Input
                value={form.units}
                onChange={(e) => setForm({ ...form, units: e.target.value })}
                placeholder="ft"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>MRP (₹)</Label>
              <Input
                type="number"
                value={form.mrp}
                onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                placeholder="34999"
              />
            </div>
            <div>
              <Label>Offer Price (₹)</Label>
              <Input
                type="number"
                value={form.offerPrice}
                onChange={(e) => setForm({ ...form, offerPrice: e.target.value })}
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Premium leather sofa..."
              rows={3}
            />
          </div>

          {/* ---- MULTI IMAGE ---- */}
          <div>
            <Label>Images (auto-compressed less than 500 KB each)</Label>

            <div className="grid grid-cols-2 gap-3 mt-3">
              {previews.map((src, i) => (
                <div key={i} className="relative group">
                  <img
                    src={src}
                    alt={`Preview ${i + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                  <p className="text-xs text-center mt-1">
                    {(src.length * 0.75 / 1024).toFixed(0)} KB
                  </p>
                </div>
              ))}

              <div
                className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-teal-500"
                onClick={() =>
                  document.getElementById("add-multi-image")?.click()
                }
              >
                <Upload className="h-8 w-8 text-gray-400" />
                <p className="text-sm text-gray-600 mt-2">
                  {previews.length
                    ? "Upload more images"
                    : "Click or drag to upload"}
                </p>
              </div>
            </div>

            <input
              id="add-multi-image"
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handleImageChange}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={saveProduct}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {editing ? "Update" : "Add"} Product
            </Button>
            {editing && (
              <Button variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* ---- ACCORDION LIST ---- */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Products</h2>

          <div className="border rounded-lg bg-white">
            {Object.keys(filteredProducts).length === 0 ? (
              <p className="text-center text-gray-400 py-8">
                {filterId
                  ? `No product with ID ${filterId}`
                  : "No products yet"}
              </p>
            ) : (
              Object.entries(filteredProducts).map(([cat, list]) => (
                <div key={cat} className="border-b last:border-b-0">
                  <button
                    onClick={() => toggleCat(cat)}
                    className="w-full px-4 py-3 flex items-center justify-between bg-amber-50 hover:bg-amber-100 transition-colors"
                  >
                    <h3 className="font-medium text-amber-700">
                      {cat} ({list.length})
                    </h3>
                    {openCats[cat] ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </button>

                  {openCats[cat] && (
                    <div className="p-4 space-y-2 bg-gray-50">
                      {list.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-2 bg-white rounded border text-sm"
                        >
                          <div className="flex items-center gap-2">
                            {p.images?.[0] ? (
                              <img
                                src={p.images[0]}
                                alt={p.name}
                                className="w-9 h-9 object-cover rounded"
                              />
                            ) : (
                              <div className="w-9 h-9 bg-gray-200 rounded flex items-center justify-center text-xs">
                                No img
                              </div>
                            )}
                            <div>
                              <p className="font-medium">
                                [{p.id}] {p.name}
                              </p>
                              <p className="text-xs text-gray-600">
                                {p.dimension} {p.units} • ₹{p.mrp}{" "}
                                {p.offerPrice && (
                                  <span className="line-through text-red-500">
                                    ₹{p.offerPrice}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => startEdit(cat, p)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteProduct(cat, p.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}