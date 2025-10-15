import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import TrueLogo from './TrueLogo';

interface CountdownProps {
  targetDate: Date;
}

const Countdown: React.FC<CountdownProps> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex justify-center items-center gap-3 md:gap-6 mb-16">
      {[
        { value: timeLeft.days, label: 'Dias' },
        { value: timeLeft.hours, label: 'Horas' },
        { value: timeLeft.minutes, label: 'Min' },
        { value: timeLeft.seconds, label: 'Seg' }
      ].map((item, index) => (
        <div 
          key={index}
          className="group relative overflow-hidden"
        >
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 md:p-6 min-w-[90px] md:min-w-[110px] 
                         shadow-lg border border-slate-200/50 transition-all duration-300 
                         hover:shadow-xl hover:scale-105 hover:bg-white">
            <div className="text-3xl md:text-5xl font-light text-slate-800 mb-1 tabular-nums">
              {String(item.value).padStart(2, '0')}
            </div>
            <div className="text-xs md:text-sm font-medium text-slate-500 uppercase tracking-wider">
              {item.label}
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 
                         rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
        </div>
      ))}
    </div>
  );
};

const QRCodeComponent: React.FC<{ platform: string; url: string; logoSrc: string }> = ({ platform, url, logoSrc }) => (
  <div className="group relative overflow-hidden">
    <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 
                   shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_20px_60px_rgb(0,0,0,0.15)]
                   border border-slate-200/50 transition-all duration-500 hover:scale-[1.02] hover:bg-white">
      <div className="flex items-center justify-between gap-8">
        {/* Platform Info */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <img 
              src={logoSrc} 
              alt={`${platform} Logo`} 
              className="h-20 w-auto object-contain transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 
                           rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-slate-800 text-lg mb-1">
              Disponível para
            </h3>
            <p className="text-2xl font-light text-slate-600">
              {platform}
            </p>
          </div>
        </div>
        
        {/* QR Code */}
        <div className="relative">
          <div className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_rgb(0,0,0,0.08)] border border-slate-100">
            <QRCode
              value={url}
              size={140}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              viewBox={`0 0 256 256`}
              fgColor="#1e293b"
              bgColor="#ffffff"
            />
          </div>
          <div className="absolute -inset-2 bg-gradient-to-r from-emerald-400/10 to-teal-400/10 
                         rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
        </div>
      </div>
      

    </div>
    
    {/* Hover Effect Background */}
    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 
                   rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-20" />
  </div>
);

const DesktopLanding: React.FC = () => {
  const targetDate = new Date('2025-12-04T00:00:00');
  
  // URLs das lojas de aplicativos (temporárias - substituir pelos links reais quando disponíveis)
  const playStoreUrl = "https://play.google.com/store/apps/details?id=com.truecon.app";
  const appStoreUrl = "https://apps.apple.com/app/truecon/id123456789";

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-emerald-50 
                    relative overflow-hidden flex flex-col">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-100 rounded-full mix-blend-multiply 
                       filter blur-xl animate-pulse" />
        <div className="absolute top-40 right-20 w-72 h-72 bg-teal-100 rounded-full mix-blend-multiply 
                       filter blur-xl animate-pulse animation-delay-2000" />
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-slate-100 rounded-full mix-blend-multiply 
                       filter blur-xl animate-pulse animation-delay-4000" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center py-4 px-6">
        <div className="max-w-6xl mx-auto w-full">
          {/* Header */}
          <header className="text-center mb-6">
            <div className="flex items-center justify-center gap-5 mb-4">
              <img 
                src="/img/logo_truechange.webp" 
                alt="TrueChange Logo" 
                className="h-16 w-auto object-contain"
              />
              <div className="text-slate-400 text-2xl font-light">|</div>
              <h1 className="text-2xl font-light text-slate-800">
                True<span className="text-emerald-600">Con</span>
              </h1>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent max-w-md mx-auto" />
          </header>

          {/* Hero Section */}
          <section className="text-center mb-8">
            <div className="space-y-3 mb-8">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-extralight text-slate-800 leading-tight">
                O app já está
                <span className="block font-light text-emerald-600">no ar!</span>
              </h2>
              <p className="text-base md:text-lg font-light text-slate-600 max-w-lg mx-auto leading-relaxed">
                Vai ficar de fora da revolução digital?
              </p>
            </div>

            {/* Call to Action */}
            <div className="bg-white/60 backdrop-blur-md rounded-xl p-4 md:p-6 max-w-xl mx-auto 
                           shadow-lg border border-slate-200/50 mb-8">
              <h3 className="text-lg md:text-xl font-light text-slate-800 mb-3">
                Acesse o QR code e baixe agora
              </h3>
              <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent mb-4" />
              <p className="text-sm font-light text-slate-600">
                Transforme sua experiência com o TrueCon
              </p>
            </div>
          </section>

          {/* Countdown Section */}
          <section className="text-center mb-6">
            <h4 className="text-base md:text-lg font-light text-slate-800 mb-4">
              Contagem Regressiva para a True<span className="text-emerald-600">Con</span> | Data Oficial 04/12/2025
            </h4>
            <Countdown targetDate={targetDate} />
          </section>

          {/* QR Codes Section */}
          <section className="mb-6">
            <h4 className="text-lg md:text-xl font-light text-slate-800 text-center mb-6">
              Baixe o App Agora
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-4xl mx-auto">
              <QRCodeComponent 
                platform="Android" 
                url="https://play.google.com/store/apps/details?id=com.truechange.truecon"
                logoSrc="/img/android.png"
              />
              <QRCodeComponent 
                platform="iOS" 
                url="https://apps.apple.com/app/truecon/id123456789"
                logoSrc="/img/ios.png"
              />
            </div>
          </section>

          {/* Footer */}
          <footer className="text-center mt-4">
            <p className="text-xs text-slate-500 font-light">
              © 2025 TrueChange. Todos os direitos reservados.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default DesktopLanding;