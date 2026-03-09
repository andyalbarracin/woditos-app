
-- Insert dummy stories with stock images (expires in 24h from now)
INSERT INTO public.stories (author_user_id, media_url, expires_at) VALUES
  ('a75c3da4-0bc9-4b81-97c9-5cbdb7d47e3c', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=900&fit=crop', now() + interval '24 hours'),
  ('a75c3da4-0bc9-4b81-97c9-5cbdb7d47e3c', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=900&fit=crop', now() + interval '24 hours'),
  ('532aa0b8-347d-4190-8f89-c8b57fcab2df', 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&h=900&fit=crop', now() + interval '24 hours'),
  ('532aa0b8-347d-4190-8f89-c8b57fcab2df', 'https://images.unsplash.com/photo-1461896836934-bd45ba25e06b?w=600&h=900&fit=crop', now() + interval '24 hours'),
  ('40e8cf75-85b0-471a-8696-ba4f4021409f', 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&h=900&fit=crop', now() + interval '24 hours'),
  ('076f7c17-6e0a-4e74-8c73-9a7c3004115e', 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=600&h=900&fit=crop', now() + interval '24 hours'),
  ('076f7c17-6e0a-4e74-8c73-9a7c3004115e', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=900&fit=crop', now() + interval '24 hours'),
  ('076f7c17-6e0a-4e74-8c73-9a7c3004115e', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=900&fit=crop', now() + interval '24 hours');
