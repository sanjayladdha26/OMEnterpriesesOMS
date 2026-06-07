CREATE TABLE public.order_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    sender_id text NOT NULL,
    sender_role text NOT NULL,
    sender_name text NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to order_messages" ON public.order_messages USING (true) WITH CHECK (true);

GRANT ALL ON TABLE public.order_messages TO anon;
GRANT ALL ON TABLE public.order_messages TO authenticated;
GRANT ALL ON TABLE public.order_messages TO service_role;
