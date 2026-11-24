import React from 'react';

export interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  inverted?: boolean;
  subtitle?: string;
  badge?: string;
  className?: string;
  textClassName?: string;
  onClick?: () => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  inverted = false,
  subtitle,
  badge,
  className = '',
  textClassName = '',
  onClick,
}) => {
  const sizeConfig = {
    xs: {
      box: 'w-6 h-6 rounded-lg',
      radius: 'rounded-md',
      text: 'font-heading text-[15px] font-extrabold tracking-tight',
      sub: 'text-[13px]',
    },
    sm: {
      box: 'w-8 h-8 rounded-xl',
      radius: 'rounded-[10px]',
      text: 'font-heading text-base font-extrabold tracking-tight',
      sub: 'text-[13px]',
    },
    md: {
      box: 'w-9 h-9 rounded-xl',
      radius: 'rounded-[10px]',
      text: 'font-heading text-lg sm:text-xl font-extrabold tracking-tight',
      sub: 'text-[13px]',
    },
    lg: {
      box: 'w-10 h-10 rounded-xl',
      radius: 'rounded-[11px]',
      text: 'font-heading text-xl sm:text-2xl font-extrabold tracking-tight',
      sub: 'text-[13px]',
    },
    xl: {
      box: 'w-12 h-12 rounded-2xl',
      radius: 'rounded-xl',
      text: 'font-heading text-2xl sm:text-[26px] font-extrabold tracking-tight',
      sub: 'text-sm',
    },
  }[size];

  const content = (
    <div
      className={`inline-flex items-center gap-2.5 transition-opacity ${
        onClick ? 'cursor-pointer hover:opacity-90' : ''
      } ${className}`}
      onClick={onClick}
    >
      {/* Official MatthOrg Emblem Container */}
      <div
        className={`${sizeConfig.box} ${
          inverted
            ? 'bg-white p-0.5 shadow-sm'
            : 'bg-[#0B192C] p-0.5 shadow-md'
        } flex items-center justify-center shrink-0 overflow-hidden relative group`}
      >
        <img
          src="/logo.png"
          alt="MatthOrg Logo"
          className={`w-full h-full object-cover ${sizeConfig.radius}`}
          onError={(e) => {
            // If image fails, keep fallback container visible
            (e.currentTarget as HTMLElement).style.opacity = '0';
          }}
        />
        {/* Subtle letter fallback behind image if loading or network error */}
        <span
          className={`font-heading absolute inset-0 flex items-center justify-center font-extrabold ${
            inverted ? 'text-[#0B192C]' : 'text-white'
          } ${size === 'xs' ? 'text-[13px]' : size === 'sm' ? 'text-sm' : 'text-base'} -z-10`}
        >
          M
        </span>
      </div>

      {/* Brand Wordmark & Optional Subtitle */}
      {showText && (
        <div className="flex flex-col text-left leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={`${sizeConfig.text} ${
                textClassName || (inverted ? 'text-white' : 'text-[#0B192C]')
              }`}
            >
              MATTHORG
            </span>
            {badge && (
              <span
                className={`text-[13px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${
                  inverted
                    ? 'bg-white/20 text-white'
                    : 'bg-[#0B192C]/10 text-[#0B192C]'
                }`}
              >
                {badge}
              </span>
            )}
          </div>

          {subtitle && (
            <span
              className={`${sizeConfig.sub} font-semibold uppercase tracking-wider mt-0.5 ${
                inverted ? 'text-slate-300' : 'text-[#5B6D85]'
              }`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="text-left focus:outline-none"
        aria-label="MatthOrg Home"
      >
        {content}
      </button>
    );
  }

  return content;
};
