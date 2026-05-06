import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Today's Sales",
      value: "12,500",
      desc: "View daily sales report",
      path: "/sales-report",
      color: "bg-blue-500",
    },
    {
      title: "Total Profit",
      value: "3,200",
      desc: "Approx profit analysis",
      path: "/profit-report",
      color: "bg-green-500",
    },
    {
      title: "Low Stock",
      value: "5",
      desc: "Products running low",
      path: "/low-stock-report",
      color: "bg-red-500",
    },
    {
      title: "Expiring Soon",
      value: "8",
      desc: "Medicines near expiry",
      path: "/expiring-medicines",
      color: "bg-yellow-500",
    },
  ];

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500">
          Pharmacy overview & key insights
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        {cards.map((item, index) => (
          <div
            key={index}
            onClick={() => navigate(item.path)}
            className="cursor-pointer bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition border border-gray-100"
          >

            {/* NUMBER */}
            <div className={`text-white text-xl font-bold w-fit px-3 py-1 rounded-md ${item.color}`}>
              {item.value}
            </div>

            {/* TITLE */}
            <h2 className="mt-3 font-semibold text-gray-800">
              {item.title}
            </h2>

            {/* DESC */}
            <p className="text-xs text-gray-500 mt-1">
              {item.desc}
            </p>

          </div>
        ))}

      </div>
    </div>
  );
}