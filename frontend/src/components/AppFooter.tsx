import React from 'react';

const AppFooter: React.FC = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="text-center text-xs text-gray-500 mt-8 py-4">
      <p className="font-medium text-gray-600">
        © {year} Cody Ha · sonbaodigi@gmail.com · Learning Outcomes Evaluation System (LOES)
      </p>
    </footer>
  );
};

export default AppFooter;

