import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface ViewMoreLinkProps {
  to: string;
  text?: string;
  className?: string;
}

const ViewMoreLink: React.FC<ViewMoreLinkProps> = ({ 
  to, 
  text = "View All", 
  className = "" 
}) => {
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300 ${className}`}
    >
      {text}
      <ChevronRight className="w-4 h-4" />
    </Link>
  );
};

export default ViewMoreLink;
