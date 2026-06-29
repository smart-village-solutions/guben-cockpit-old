import { BookOpenIcon, ShoppingBagIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface CategoryTile {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  href: string;
}

const categories: CategoryTile[] = [
  {
    id: "schools",
    title: "Schulen",
    icon: BookOpenIcon,
    color: "#17a697",
    href: "/projects/schools",
  },
  {
    id: "marketplace",
    title: "Marktplatz",
    icon: ShoppingBagIcon,
    color: "#f4734c",
    href: "/projects/marketplace",
  },
];

export const CategoryTiles = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 w-full mt-8 mb-8">
      <div className="flex flex-row gap-6">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Link
              key={category.id}
              to={category.href}
              className="group block no-underline"
              style={{ width: '200px', height: '200px' }}
            >
              <div
                className="flex flex-col items-center justify-center p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 w-full h-full cursor-pointer"
                style={{ backgroundColor: category.color }}
              >
                <Icon className="w-24 h-24 text-white mb-4 group-hover:scale-110 transition-transform duration-200" />
                <h2 className="text-sm font-bold text-black text-center uppercase">
                  {category.title}
                </h2>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
