-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('social', 'milestone', 'nudge', 'digest')),
  title text NOT NULL,
  body text NOT NULL,
  read boolean DEFAULT false,
  habit_id uuid REFERENCES habits(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Notification preferences on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notif_social boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notif_milestone boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notif_nudge boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notif_digest boolean DEFAULT false;

-- Track last nudge sent per habit to enforce once-per-week cap
ALTER TABLE habits ADD COLUMN IF NOT EXISTS last_nudge_at timestamptz DEFAULT null;
