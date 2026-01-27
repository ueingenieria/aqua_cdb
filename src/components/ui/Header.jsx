import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export function Header({ title }) {
    const navigate = useNavigate();
    return (
        <div className="w-full bg-[#e97400] h-16 flex items-center px-4 shadow-md sticky top-0 z-50">
            <button onClick={() => navigate(-1)} className="text-white p-2 -ml-2">
                <ChevronLeft className="h-8 w-8" />
            </button>
            <h1 className="text-white font-display text-xl font-light ml-2 flex-1 text-center pr-10">
                {title}
            </h1>
        </div>
    )
}
