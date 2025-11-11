
"use client";

import * as React from "react";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

const products = [
  {
    title: "Chairs",
    href: "/products/electronics",
    description: "Discover the latest gadgets and tech innovations.",
  },
  {
    title: "Table",
    href: "/products/clothing",
    description: "Stylish apparel for every occasion and season.",
  },
  {
    title: "Dinings",
    href: "/products/home",
    description: "Essentials to make your space comfortable and functional.",
  },
  {
    title: "Sofa",
    href: "/products/accessories",
    description: "Complement your style with our range of add-ons.",
  },
  {
    title: "Beds",
    href: "/products/accessories",
    description: "Complement your style with our range of add-ons.",
  },
  {
    title: "Drawings",
    href: "/products/accessories",
    description: "Complement your style with our range of add-ons.",
  },
  {
    title: "Office ",
    href: "/products/accessories",
    description: "Complement your style with our range of add-ons.",
  },
];

export function Navigation() {
  return (
    <nav className="hidden md:flex items-center space-x-4">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
              <Link href="/">Home</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
              <Link href="/ProductsCatalogue">Catalogue</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger>Products</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                {products.map((product) => (
                  <ListItem
                    key={product.title}
                    title={product.title}
                    href={product.href}
                  >
                    {product.description}
                  </ListItem>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
              <Link href="/ContactUs">Contact Us</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </nav>
  );
}

const ListItem = React.forwardRef(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={`block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${className || ""}`}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});

ListItem.displayName = "ListItem";