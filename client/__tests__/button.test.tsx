import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("<Button />", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("respects the loading state", () => {
    render(<Button loading>Saving</Button>);
    const btn = screen.getByRole("button", { name: /saving/i });
    expect(btn).toBeDisabled();
  });

  it("supports gradient variant class", () => {
    render(<Button variant="gradient">Hello</Button>);
    expect(screen.getByRole("button")).toHaveClass("from-indigo-500");
  });
});
