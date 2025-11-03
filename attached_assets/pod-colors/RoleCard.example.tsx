
import React from 'react';

export function RoleCard({ name, pod, role, onClick }){
  return (
    <div data-pod={pod} className="group rounded-2xl border pod-border p-4 bg-white shadow hover:shadow-md transition">
      <div className="pod-chip inline-block mb-3">{pod}</div>
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="text-sm opacity-80">{role}</p>
      <button onClick={onClick} className="mt-3 pod-accent rounded-lg px-3 py-2 font-medium">
        Open
      </button>
    </div>
  );
}
