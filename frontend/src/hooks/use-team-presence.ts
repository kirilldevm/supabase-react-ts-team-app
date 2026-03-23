import { supabase } from '@/lib/client';
import type { MemberPresence } from '@/types/team';
import type { User } from '@supabase/supabase-js';
import { useEffect, useRef, useState } from 'react';

export function useTeamPresence(teamId: string | undefined, user: User | null) {
  const [onlineMap, setOnlineMap] = useState<Record<string, MemberPresence>>(
    {},
  );
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!teamId || !user) return;

    const channelName = `team-presence:${teamId}`;
    const channel = supabase.channel(channelName, {
      config: { presence: { key: user.id } },
    });

    channelRef.current = channel;

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<MemberPresence>();
      const next: Record<string, MemberPresence> = {};

      for (const [, presences] of Object.entries(state)) {
        const first = presences[0];
        if (first) {
          next[first.user_id] = first;
        }
      }

      setOnlineMap(next);
    });

    void channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: user.id,
          email: user.email ?? user.id,
          online_at: new Date().toISOString(),
        } satisfies MemberPresence);
      }
    });

    return () => {
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [teamId, user]);

  return onlineMap;
}
