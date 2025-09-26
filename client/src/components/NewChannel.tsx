import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { createNewChannel } from "@/services/streamService"

export type NewChannelProps = {
  onChannelCreated: () => void;
}

const FILE_SIZE_LIMIT = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/svg+xml",
  "image/gif",
];

const formSchema = z.object({
  channelName: z.string().min(3, {
    message: "Channel name must be at least 3 characters.",
  }),
  channelIcon: z
    .custom<File>((file) => file instanceof File, {
      message: "Please upload a valid image file",
    })
    .refine(
      (file) =>
        ACCEPTED_IMAGE_TYPES.includes(file.type),
      { message: "Invalid image file type" },
    )
    .refine((file) => file.size <= FILE_SIZE_LIMIT, {
      message: "File size should not exceed 5MB",
    })
})

export type NewChannelType = z.infer<typeof formSchema>;

export const NewChannel = ({ onChannelCreated }: NewChannelProps) => {

  const [icon, setIcon] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const form = useForm<NewChannelType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      channelName: "",
      channelIcon: undefined,
    },
  })

  useEffect(() => {
    if (!icon) {
      setPreview(null)
      return
    }

    const objectUrl = URL.createObjectURL(icon)
    setPreview(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [icon])

  const onSubmit = async (values: NewChannelType) => {
    try {
      await createNewChannel(values);
      onChannelCreated();
    } catch (error: any) {
      setError(error?.message ?? "Something went wrong");
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldOnChange: (...event: any[]) => void) => {
    const file = e.target.files?.[0] || null
    setIcon(file ?? null)
    fieldOnChange(file)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="channelName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Channel Name</FormLabel>
              <FormControl>
                <Input className="w-96" placeholder="e.g. Yang's Family" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="channelIcon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Channel Icon</FormLabel>
              <FormControl>
                <div className="flex items-center gap-4">
                  <label
                    htmlFor="icon-upload"
                    className="relative w-24 h-24 rounded-full overflow-hidden flex items-center justify-center border border-dashed border-gray-400 cursor-pointer hover:shadow-md transition"
                  >
                    {preview ? (
                      <img
                        src={preview}
                        alt="Channel icon preview"
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="text-center text-gray-500 text-sm">
                        <div className="text-2xl">+</div>
                        Upload
                      </div>
                    )}
                    <input
                      id="icon-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, field.onChange)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>

                  {icon && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setIcon(null)
                        setPreview(null)
                        field.onChange(undefined)
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={!form.formState.isValid}>Submit</Button>
      </form>
      {error && <p className="text-destructive">Error creating channel, please try again later</p>}
    </Form>
  )
}

export default NewChannel