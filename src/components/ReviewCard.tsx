import React from 'react';
import { Star } from 'lucide-react';

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
        <img src={avatar} alt={name} className="w-12 h-12 rounded-full object-cover" />
        <div className="ml-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">{name}</h4>
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