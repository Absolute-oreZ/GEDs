import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface PermissionCardProps {
    title: string;
    iconUrl?: string;
}

const Alert = ({ title, iconUrl }: PermissionCardProps) => {
    return (
        <section className="flex items-center justify-center h-full w-full">
            <Card className="w-full max-w-[520px] border-none bg-dark-1 p-6 py-9">
                <CardContent>
                    <div className="flex flex-col gap-9">
                        <div className="flex items-center gap-3.5">
                            {iconUrl && (
                                <div className="flex-center">
                                    <img src={iconUrl} width={72} height={72} alt="icon" />
                                </div>
                            )}
                            <p className="text-center text-xl font-semibold">{title}</p>
                        </div>

                        <Button asChild>
                            <Link to="/">Back to Home</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
};

export default Alert;