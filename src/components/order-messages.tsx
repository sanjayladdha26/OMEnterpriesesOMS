"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useOrderMessages, useAddOrderMessage, useDeleteOrderMessage, useUpdateOrderMessage } from "@/lib/hooks";
import { Send, Loader2, ImageIcon, X, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { ImageViewerModal } from "@/components/ui/image-viewer-modal";

export function OrderMessagesChat({ orderId }: { orderId: string | null }) {
  const { role, staff, agent, party } = useAuthStore();
  const { data: messages, isLoading } = useOrderMessages(orderId);
  const addMessage = useAddOrderMessage();
  const deleteMessage = useDeleteOrderMessage();
  const updateMessage = useUpdateOrderMessage();
  
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Image states
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewImage, setViewImage] = useState<{ url: string; alt: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Edit & Menu states
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const supabase = createClient();

  let currentUserId = "unknown";
  let currentUserName = "Unknown User";

  if (role === "admin") {
    currentUserId = staff?.id || "admin";
    currentUserName = staff?.name || "Admin";
  } else if (role === "staff") {
    currentUserId = staff?.id || "unknown_staff";
    currentUserName = staff?.name || "Staff";
  } else if (role === "agent") {
    currentUserId = agent?.id || "unknown_agent";
    currentUserName = agent?.name || "Agent";
  } else if (role === "party") {
    currentUserId = party?.id || "unknown_party";
    currentUserName = party?.account_name || "Party";
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    if (!editingMessageId) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, editingMessageId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const removeImage = () => {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setNewMessage("");
  };

  const startEdit = (id: string, text: string) => {
    setEditingMessageId(id);
    setNewMessage(text);
    setActiveMenuId(null);
  };

  const handleUnsend = async (id: string) => {
    try {
      await deleteMessage.mutateAsync({ messageId: id });
      setActiveMenuId(null);
    } catch {
      toast.error("Failed to unsend message");
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !file) || !orderId || isUploading) return;

    if (editingMessageId) {
      try {
        await updateMessage.mutateAsync({
          messageId: editingMessageId,
          newText: newMessage.trim()
        });
        setEditingMessageId(null);
        setNewMessage("");
      } catch {
        toast.error("Failed to update message");
      }
      return;
    }

    setIsUploading(true);
    let imageUrl: string | undefined = undefined;

    try {
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `chat/${orderId}_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);

        if (uploadError) {
          toast.error("Failed to upload image.");
          setIsUploading(false);
          return;
        }

        if (data) {
           const { data: publicUrlData } = supabase.storage
             .from('product-images')
             .getPublicUrl(fileName);
             
           imageUrl = publicUrlData.publicUrl;
        }
      }

      await addMessage.mutateAsync({
        order_id: orderId,
        sender_id: currentUserId,
        sender_role: role || "unknown",
        sender_name: currentUserName,
        message: newMessage.trim(),
        image_url: imageUrl,
        is_edited: false,
        is_deleted: false,
      });
      
      setNewMessage("");
      removeImage();
    } catch (err) {
      toast.error("Failed to send message");
    } finally {
      setIsUploading(false);
    }
  };

  if (!orderId) return null;

  return (
    <div className="flex flex-col h-full bg-surface border border-border rounded-xl overflow-hidden no-print relative">
      <div className="p-3 border-b border-border bg-surface-hover">
        <h4 className="text-sm font-semibold text-text-primary">Order Chat</h4>
        <p className="text-xs text-text-muted mt-0.5">Discuss details or quantities</p>
      </div>

      <div className="flex-1 p-4 overflow-y-auto min-h-[250px] max-h-[400px] space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-sm text-text-muted italic">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            const isInternal = msg.sender_role === "admin" || msg.sender_role === "staff";

            if (msg.is_deleted) {
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[85%]",
                    isMe ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className="px-3 py-2 rounded-2xl text-sm italic text-text-muted bg-surface-hover border border-border flex items-center gap-2">
                    <Trash2 className="w-3 h-3" />
                    This message was deleted
                  </div>
                  <span className="text-[10px] text-text-muted mt-1 px-1">
                    {new Date(msg.created_at).toLocaleTimeString("en-IN", {
                      hour: "numeric",
                      minute: "numeric",
                      hour12: true,
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[85%] group relative",
                  isMe ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div className="flex items-baseline gap-2 mb-1 px-1 relative w-full justify-end">
                  {!isMe && (
                    <span className="text-[10px] text-text-muted capitalize mr-auto">
                      {msg.sender_name} ({msg.sender_role})
                    </span>
                  )}
                  {isMe && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-text-primary">
                        You
                      </span>
                    </div>
                  )}
                </div>

                <div className="relative flex items-center gap-2 max-w-full">
                  {isMe && (
                    <div className={cn(
                      "relative transition-opacity",
                      activeMenuId === msg.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === msg.id ? null : msg.id);
                        }}
                        className="p-1 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-full"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {activeMenuId === msg.id && (
                        <div 
                          className="absolute right-0 top-full mt-1 w-32 bg-surface border border-border rounded-xl shadow-lg z-[60] py-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => startEdit(msg.id, msg.message)}
                            className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-surface-hover flex items-center gap-2"
                          >
                            <Pencil className="w-4 h-4" /> Edit
                          </button>
                          <button
                            onClick={() => handleUnsend(msg.id)}
                            className="w-full text-left px-3 py-2 text-sm text-red hover:bg-red/10 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" /> Unsend
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div 
                    className={cn(
                      "flex flex-col max-w-full transition-all duration-200 ease-out origin-bottom",
                      isMe ? "cursor-pointer active:scale-[0.97]" : ""
                    )}
                    onClick={(e) => {
                      if (isMe) {
                        e.stopPropagation();
                        setActiveMenuId(msg.id);
                      }
                    }}
                  >
                    {msg.image_url && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent menu from opening when viewing image
                          setViewImage({ url: msg.image_url!, alt: "Chat image" });
                        }}
                        className={cn(
                          "rounded-2xl overflow-hidden hover:opacity-90 transition-opacity focus:outline-none shadow-sm mb-1",
                          !msg.message && (isMe ? "rounded-br-sm" : "rounded-bl-sm")
                        )}
                      >
                        <img src={msg.image_url} alt="Attached" className="max-w-[240px] max-h-64 object-cover" />
                      </button>
                    )}
                    {msg.message && (
                      <div
                        className={cn(
                          "px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words",
                          isMe
                            ? "bg-primary text-white rounded-br-sm"
                            : isInternal
                            ? "bg-amber-light text-text-primary rounded-bl-sm"
                            : "bg-surface-hover border border-border text-text-primary rounded-bl-sm",
                          msg.image_url && (isMe ? "rounded-tr-md" : "rounded-tl-md")
                        )}
                      >
                        {msg.message}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 mt-1 px-1">
                  {msg.is_edited && (
                    <span className="text-[10px] text-text-muted italic">(edited)</span>
                  )}
                  <span className="text-[10px] text-text-muted">
                    {new Date(msg.created_at).toLocaleTimeString("en-IN", {
                      hour: "numeric",
                      minute: "numeric",
                      hour12: true,
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-border bg-surface">
        {editingMessageId && (
          <div className="mb-2 flex items-center justify-between px-2 text-sm text-primary font-medium">
            <span>Editing message...</span>
            <button onClick={cancelEdit} className="text-text-muted hover:text-text-primary">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {previewUrl && !editingMessageId && (
          <div className="mb-3 relative inline-block">
            <img src={previewUrl} alt="Preview" className="h-20 w-auto rounded-lg border border-border object-cover" />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        
        <form onSubmit={handleSend} className="flex items-end gap-2">
          {!editingMessageId && (
            <>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                disabled={isUploading}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="p-2.5 text-text-muted hover:text-primary hover:bg-surface-hover rounded-xl transition-colors disabled:opacity-50 flex-shrink-0"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            </>
          )}
          
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={editingMessageId ? "Edit your message..." : "Type a message..."}
            className="flex-1 min-h-[40px] max-h-[120px] resize-y px-3 py-2 border border-border rounded-xl bg-background text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
            disabled={isUploading || updateMessage.isPending}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={(!newMessage.trim() && !file && !editingMessageId) || isUploading || updateMessage.isPending}
            className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {isUploading || addMessage.isPending || updateMessage.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : editingMessageId ? (
              <CheckIcon className="w-5 h-5" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>

      {/* Overlay to close menu */}
      {activeMenuId && (
        <div 
          className="fixed inset-0 z-[50]" 
          onClick={() => setActiveMenuId(null)}
          onPointerDown={() => setActiveMenuId(null)}
          onContextMenu={(e) => { e.preventDefault(); setActiveMenuId(null); }}
        />
      )}

      {/* Image Viewer Modal */}
      {viewImage && (
        <ImageViewerModal
          imageUrl={viewImage.url}
          altText={viewImage.alt}
          onClose={() => setViewImage(null)}
        />
      )}
    </div>
  );
}

function CheckIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
