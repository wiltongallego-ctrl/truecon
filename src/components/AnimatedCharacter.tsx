import React from 'react';

const AnimatedCharacter: React.FC = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          
          .float-main {
            animation: float 3s ease-in-out infinite;
          }
        `}
      </style>
      
      {/* Imagem PNG com animação de flutuação */}
       <div className="float-main flex items-center justify-center">
         <img 
           src="/img/logo_flu.png" 
           alt="Logo TrueCon" 
           className="max-w-[300px] max-h-[250px] w-auto h-auto object-contain"
         />
       </div>
    </div>
  );
};

export default AnimatedCharacter;