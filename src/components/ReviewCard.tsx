import { Star, ShieldCheck } from 'lucide-react';

interface ReviewCardProps {
  name: string;
  platform: string;
  rating: number;
  comment: string;
  avatar: string;
  date: string;
}

export function ReviewCard({ name, platform, rating, comment, avatar, date }: ReviewCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-lg dark:bg-brand-primary/20 shrink-0">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="ml-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="font-semibold text-gray-900 dark:text-white">{name}</h4>
            <span className="text-[10px] bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5" title="Foto anonimizada por privacidad">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verificado
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{platform}</p>
        </div>
      </div>
      
      <div className="flex mb-2">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-5 h-5 ${
              i < rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
      
      <p className="text-gray-600 dark:text-gray-300 mb-2">{comment}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{date}</p>
    </div>
  );
}