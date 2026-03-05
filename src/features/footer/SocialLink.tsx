export default function SocialLink({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
  return (
    <a 
        href={href} 
        target="_blank" 
        rel="noreferrer noopener" 
        aria-label={label} 
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-teal-500/20 hover:border-teal-500/50 hover:scale-110 active:scale-95 transition-all duration-300 group"
    >
        <div className="group-hover:text-teal-400 transition-colors">
          {icon}
        </div>
    </a>
  );
}