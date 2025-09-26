import { FiPlus, FiFilter } from "react-icons/fi";
import { Button } from "./ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import NewChannel, { type NewChannelProps } from "./NewChannel";

const ChannelListHeader = ({ onChannelCreated}: NewChannelProps) => {
    return (
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
            <h2 className="text-lg font-semibold">All Channels</h2>
            <div className="flex items-center gap-2 w-fit">
                <Dialog>
                        <DialogTrigger asChild>
                            <Button className="hover:cursor-pointer" title="Create or join channel" variant="outline"><FiPlus size={20} /></Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>New Channel</DialogTitle>
                                <DialogDescription>
                                    Feeling lonely? Looking for new friends? Worry not, go ahead and create a channel
                                </DialogDescription>
                            </DialogHeader>
                            <NewChannel onChannelCreated={onChannelCreated}  />
                        </DialogContent>
                </Dialog>
                <Button
                    title="Filter Channels"
                    variant="secondary"
                    className="p-2 transition hover:cursor-pointer"
                >
                    <FiFilter size={20} />
                </Button>
            </div>
        </div>
    );
};

export default ChannelListHeader;
