import { NavLink } from "react-router-dom";

export default function LeftRail() {
  const items = [
    { to: "/wo/create", label: "WO • Create" },
    { to: "/wo/playbook-preview", label: "WO • Playbook" },
    { to: "/onboarding/success", label: "Onboarding • Success" },
    { to: "/coverage/deep-dive", label: "Coverage • Deep Dive" },
    { to: "/ops/alerts", label: "Ops • Alerts" },
    { to: "/llm/provider", label: "LLM • Provider" },
  ];
  return (
    <aside className="w-64 border-r p-4">
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.to}>
            <NavLink
              to={it.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded ${isActive ? "bg-gray-200" : "hover:bg-gray-100"}`
              }
            >
              {it.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  );
}
