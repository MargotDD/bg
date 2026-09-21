import React from 'react';

// Cheering Anime Girl Mascot Avatar (Arms raised high, used in Sidebar header)
export const MascotGirlCheering: React.FC<{ className?: string; size?: number }> = ({ 
  className = "w-12 h-12",
  size = 48 
}) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      width={size}
      height={size}
    >
      {/* Background circle */}
      <circle cx="50" cy="50" r="48" fill="#FFF2F5" stroke="#F8C8D4" strokeWidth="2" />
      
      {/* Hair back */}
      <path d="M20 48C20 28 32 14 50 14C68 14 80 28 80 48C80 62 76 74 74 80C70 70 68 58 68 46C68 46 60 52 50 52C40 52 32 46 32 46C32 58 30 70 26 80C24 74 20 62 20 48Z" fill="#583A35" />
      
      {/* Body / Shirt */}
      <path d="M34 80C34 73 40 70 50 70C60 70 66 73 66 80L69 98H31L34 80Z" fill="#FFFFFF" stroke="#E27387" strokeWidth="1.5" />
      <path d="M46 70L50 78L54 70" stroke="#E27387" strokeWidth="1.5" fill="#FFE5EC" />
      
      {/* Arms waving up high celebrating */}
      <path d="M32 76C26 69 22 59 23 52C25 50 29 53 31 58L35 73" fill="#FFEAE5" stroke="#4A2F2B" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M68 76C74 69 78 59 77 52C75 50 71 53 69 58L65 73" fill="#FFEAE5" stroke="#4A2F2B" strokeWidth="1.5" strokeLinecap="round" />
      
      {/* Head / Face */}
      <ellipse cx="50" cy="48" rx="21" ry="19" fill="#FFF3EE" />
      
      {/* Ears */}
      <circle cx="29" cy="48" r="3.5" fill="#FFEAE5" />
      <circle cx="71" cy="48" r="3.5" fill="#FFEAE5" />

      {/* Hair front / Bangs */}
      <path d="M27 42C27 25 37 19 50 19C63 19 73 25 73 42C69 35 63 38 58 34C54 42 46 42 42 34C37 38 31 35 27 42Z" fill="#69433D" />
      
      {/* Hair clips */}
      <rect x="32" y="27" width="5.5" height="2.5" rx="1" transform="rotate(-20 32 27)" fill="#FF6B93" />
      <rect x="63" y="25" width="5.5" height="2.5" rx="1" transform="rotate(20 63 25)" fill="#FF6B93" />

      {/* Eyes: Happy curved anime eyes */}
      <path d="M39 45C41 42 45 42 47 45" stroke="#3A211D" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M53 45C55 42 59 42 61 45" stroke="#3A211D" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* Eyebrows */}
      <path d="M40 39C42 38 45 38 47 39" stroke="#69433D" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M53 39C55 38 58 38 60 39" stroke="#69433D" strokeWidth="1.5" strokeLinecap="round" />

      {/* Blushing cheeks */}
      <ellipse cx="36" cy="51" rx="4.5" ry="2.5" fill="#FFAEC0" />
      <ellipse cx="64" cy="51" rx="4.5" ry="2.5" fill="#FFAEC0" />

      {/* Big happy open mouth */}
      <path d="M45 50C45 50 50 58 55 50C55 50 50 59 45 50Z" fill="#E85873" stroke="#3A211D" strokeWidth="1.2" />
      <path d="M47 54C49 53 51 53 53 54" stroke="#FFAEC0" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};

// Gentle Sweet Anime Girl Portrait (For Workspace Switcher & User Profile)
export const MascotGirlPortrait: React.FC<{ className?: string; size?: number }> = ({ 
  className = "w-8 h-8",
  size = 32 
}) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      width={size}
      height={size}
    >
      <circle cx="50" cy="50" r="48" fill="#FFF5F7" stroke="#F8C8D4" strokeWidth="2" />
      
      {/* Long hair */}
      <path d="M22 50C22 30 33 16 50 16C67 16 78 30 78 50C78 68 76 86 73 96C68 85 66 65 66 52C66 52 58 54 50 54C42 54 34 52 34 52C34 65 32 85 27 96C24 86 22 68 22 50Z" fill="#583A35" />
      
      {/* Head & Neck */}
      <path d="M43 72V84H57V72" fill="#FFEAE5" />
      <path d="M33 84C33 80 40 78 50 78C60 78 67 80 67 84L70 98H30L33 84Z" fill="#FFFFFF" stroke="#E27387" strokeWidth="1.5" />
      <path d="M46 78L50 84L54 78" stroke="#E27387" strokeWidth="1.5" fill="#FFE5EC" />
      
      <ellipse cx="50" cy="50" rx="20" ry="19" fill="#FFF3EE" />

      {/* Hair front / Straight bangs */}
      <path d="M28 44C28 28 38 21 50 21C62 21 72 28 72 44C68 38 62 39 58 37C55 43 45 43 42 37C38 39 32 38 28 44Z" fill="#69433D" />
      
      {/* Cute pink headband/bow */}
      <path d="M29 32C34 25 42 22 50 22C58 22 66 25 71 32" stroke="#FF7096" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="34" cy="30" r="3" fill="#FF7096" />

      {/* Sweet shiny anime eyes */}
      <ellipse cx="41" cy="49" rx="3.5" ry="4.5" fill="#3A211D" />
      <ellipse cx="59" cy="49" rx="3.5" ry="4.5" fill="#3A211D" />
      <circle cx="42" cy="47.5" r="1.5" fill="#FFFFFF" />
      <circle cx="60" cy="47.5" r="1.5" fill="#FFFFFF" />
      <circle cx="39.8" cy="51" r="0.8" fill="#FFFFFF" />
      <circle cx="57.8" cy="51" r="0.8" fill="#FFFFFF" />

      {/* Gentle smile */}
      <path d="M47 57C48.5 59 51.5 59 53 57" stroke="#9E4B5E" strokeWidth="1.8" strokeLinecap="round" />
      
      {/* Cheeks */}
      <ellipse cx="36" cy="54" rx="4" ry="2" fill="#FFAEC0" />
      <ellipse cx="64" cy="54" rx="4" ry="2" fill="#FFAEC0" />
    </svg>
  );
};

export const MascotGirlAvatar = MascotGirlCheering;

// Peeking Bunny Mascot Sticker (Sitting over top-right border of Welcome Card)
export const PeekingBunny: React.FC<{ className?: string }> = ({ className = "w-16 h-16" }) => {
  return (
    <svg 
      viewBox="0 0 100 85" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Bunny Ears */}
      {/* Left ear */}
      <path d="M30 46C22 30 24 10 32 6C39 2 45 18 42 42" fill="#FFFFFF" stroke="#4A2F2B" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M32 38C28 26 29 14 34 10C38 8 41 18 39 34" fill="#FFCCD7" />

      {/* Right ear */}
      <path d="M58 42C55 18 61 2 68 6C76 10 78 30 70 46" fill="#FFFFFF" stroke="#4A2F2B" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M61 34C59 18 62 8 66 10C71 14 72 26 68 38" fill="#FFCCD7" />

      {/* Head */}
      <ellipse cx="50" cy="58" rx="36" ry="26" fill="#FFFFFF" stroke="#4A2F2B" strokeWidth="2.5" />

      {/* Eyes: Round dark circles with shine */}
      <circle cx="37" cy="56" r="3.5" fill="#3A211D" />
      <circle cx="63" cy="56" r="3.5" fill="#3A211D" />
      <circle cx="38" cy="54.5" r="1.2" fill="#FFFFFF" />
      <circle cx="64" cy="54.5" r="1.2" fill="#FFFFFF" />

      {/* Nose and w-mouth */}
      <path d="M50 60L48 62.5H52L50 60Z" fill="#FFAEC0" />
      <path d="M46 64C48 66.5 50 66.5 50 64C50 66.5 52 66.5 54 64" stroke="#4A2F2B" strokeWidth="1.8" strokeLinecap="round" />

      {/* Rosy Cheeks */}
      <ellipse cx="30" cy="62" rx="4.5" ry="2.8" fill="#FFCCD7" />
      <ellipse cx="70" cy="62" rx="4.5" ry="2.8" fill="#FFCCD7" />

      {/* Paws resting on the bottom border */}
      <ellipse cx="35" cy="80" rx="7.5" ry="5" fill="#FFFFFF" stroke="#4A2F2B" strokeWidth="2.2" />
      <ellipse cx="65" cy="80" rx="7.5" ry="5" fill="#FFFFFF" stroke="#4A2F2B" strokeWidth="2.2" />
    </svg>
  );
};

// Peeking Kitty Sticker (Sitting over bottom-right border of AVAILABLE MONEY Card)
export const PeekingKitty: React.FC<{ className?: string }> = ({ className = "w-14 h-12" }) => {
  return (
    <svg 
      viewBox="0 0 100 85" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Cat ears */}
      <path d="M24 46L21 18L44 32" fill="#FFFFFF" stroke="#4A2F2B" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M26 38L25 24L38 33" fill="#FFCCD7" />

      <path d="M76 46L79 18L56 32" fill="#FFFFFF" stroke="#4A2F2B" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M74 38L75 24L62 33" fill="#FFCCD7" />

      {/* Head */}
      <ellipse cx="50" cy="54" rx="34" ry="24" fill="#FFFFFF" stroke="#4A2F2B" strokeWidth="2.5" />

      {/* Happy closed eyes ^ ^ */}
      <path d="M34 50C36 46 41 46 43 50" stroke="#3A211D" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M57 50C59 46 64 46 66 50" stroke="#3A211D" strokeWidth="2.2" strokeLinecap="round" />

      {/* Cute nose & w-shaped mouth */}
      <path d="M50 55L48 57.5H52L50 55Z" fill="#FFAEC0" />
      <path d="M46 59C48 61 50 61 50 59C50 61 52 61 54 59" stroke="#4A2F2B" strokeWidth="1.8" strokeLinecap="round" />

      {/* Blush */}
      <ellipse cx="30" cy="56" rx="4.5" ry="2.5" fill="#FFAEC0" />
      <ellipse cx="70" cy="56" rx="4.5" ry="2.5" fill="#FFAEC0" />

      {/* Whiskers */}
      <path d="M22 51L13 49" stroke="#4A2F2B" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M22 55L13 56" stroke="#4A2F2B" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M78 51L87 49" stroke="#4A2F2B" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M78 55L87 56" stroke="#4A2F2B" strokeWidth="1.4" strokeLinecap="round" />

      {/* Paws resting on the edge */}
      <ellipse cx="34" cy="74" rx="6.5" ry="4.8" fill="#FFFFFF" stroke="#4A2F2B" strokeWidth="2.2" />
      <ellipse cx="66" cy="74" rx="6.5" ry="4.8" fill="#FFFFFF" stroke="#4A2F2B" strokeWidth="2.2" />
    </svg>
  );
};

// Cute Kitty Icon for Search Bar
export const SearchKittyIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <path d="M5 8.5L3.5 4.5L8.5 6" stroke="#C46E82" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 8.5L20.5 4.5L15.5 6" stroke="#C46E82" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 12C3.5 7.5 7.3 6.5 12 6.5C16.7 6.5 20.5 7.5 20.5 12C20.5 16.5 16.7 18 12 18C7.3 18 3.5 16.5 3.5 12Z" stroke="#C46E82" strokeWidth="1.5" fill="#FFF5F7" />
      <circle cx="9" cy="11.5" r="1.2" fill="#C46E82" />
      <circle cx="15" cy="11.5" r="1.2" fill="#C46E82" />
      <path d="M11 13.5C11.5 14.2 12.5 14.2 13 13.5" stroke="#C46E82" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
};

// 5-Petal Sakura Flower Icon (Used in Welcome title, Announcements, Section links)
export const SakuraFlowerIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12 7.5C10.5 4 13.5 4 12 7.5Z" fill="#F8B4C4" />
      {/* 5 rounded petals */}
      <circle cx="12" cy="6.5" r="3.5" fill="#F8B4C4" />
      <circle cx="17.2" cy="10.2" r="3.5" fill="#F8B4C4" />
      <circle cx="15.2" cy="16.3" r="3.5" fill="#F8B4C4" />
      <circle cx="8.8" cy="16.3" r="3.5" fill="#F8B4C4" />
      <circle cx="6.8" cy="10.2" r="3.5" fill="#F8B4C4" />
      {/* Flower Center */}
      <circle cx="12" cy="12" r="3.2" fill="#E27387" />
    </svg>
  );
};

export const SakuraDoodle = SakuraFlowerIcon;

// Cute Piggy Bank Icon for Admin Spending in Sidebar
export const PiggyBankCuteIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Coin slot */}
      <path d="M10 6H14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      {/* Body */}
      <path d="M19 12C19 8.5 15.5 7 12 7C8 7 4.5 9 4.5 13C4.5 17 8 18 12 18C15 18 18 17 19 14.5L21.5 14V11.5L19 12Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      {/* Ear */}
      <path d="M8 7L6.5 4.5L10 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Snout dots */}
      <circle cx="20" cy="12.8" r="0.6" fill="currentColor" />
      {/* Eye */}
      <circle cx="15.5" cy="10.5" r="0.9" fill="currentColor" />
      {/* Legs */}
      <path d="M7 18V20.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M16 18V20.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
};

// Soft floating doodle clouds
export const FloatingCloud: React.FC<{ className?: string }> = ({ className = "w-24 h-12" }) => {
  return (
    <svg viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M20 40C12 40 5 33 5 25C5 17 12 11 20 11C23 11 25 12 27 13C30 7 37 3 45 3C55 3 63 9 66 17C69 15 72 14 75 14C85 14 93 21 93 30C93 39 85 45 75 45L20 45Z" fill="#FFFFFF" fillOpacity="0.8" />
    </svg>
  );
};

// Subtle ambient background doodles (hearts, sparkles, sakuras scattered around)
export const KawaiiWallpaperDoodles: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Floating pink outline hearts */}
      <svg className="absolute top-12 left-1/4 w-5 h-5 text-[#F6B3C2] opacity-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
      
      <svg className="absolute top-6 right-1/3 w-4 h-4 text-[#F6B3C2] opacity-40" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>

      <svg className="absolute top-36 right-12 w-5 h-5 text-[#F6B3C2] opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>

      <svg className="absolute top-2/3 left-10 w-4 h-4 text-[#F6B3C2] opacity-35" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>

      <svg className="absolute bottom-40 right-1/4 w-4 h-4 text-[#F6B3C2] opacity-35" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>

      {/* Sparkle 4-point crosses */}
      <span className="absolute top-20 left-12 text-[#F4A7B7] text-xs opacity-50">✦</span>
      <span className="absolute top-32 right-1/4 text-[#F4A7B7] text-xs opacity-40">✦</span>
      <span className="absolute bottom-52 left-1/3 text-[#F4A7B7] text-xs opacity-45">✦</span>
      <span className="absolute top-1/2 right-16 text-[#F4A7B7] text-xs opacity-50">✦</span>

      {/* Sakura outlines */}
      <div className="absolute top-1/3 left-6 opacity-35">
        <SakuraFlowerIcon className="w-5 h-5" />
      </div>
      <div className="absolute top-2/3 right-8 opacity-30">
        <SakuraFlowerIcon className="w-6 h-6" />
      </div>

      {/* Cloud puffs along bottom edges */}
      <div className="absolute -bottom-8 -left-12 opacity-50">
        <FloatingCloud className="w-56 h-28" />
      </div>
      <div className="absolute -bottom-10 -right-12 opacity-45">
        <FloatingCloud className="w-72 h-36" />
      </div>
    </div>
  );
};
