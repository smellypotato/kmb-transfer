import { FiChevronDown, FiChevronRight } from "react-icons/fi";

export function Chevron({ open }) {
  const Icon = open ? FiChevronDown : FiChevronRight;
  return <Icon className="chevron" aria-hidden="true" />;
}
