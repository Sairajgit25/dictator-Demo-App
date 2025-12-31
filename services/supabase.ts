
import { createClient } from '@supabase/supabase-js';

// Supabase configuration - ensure these match your Supabase project settings
const supabaseUrl = 'https://wvcbdfzmxazvwopwqijz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2Y2JkZnpteGF6dndvcHdxaWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NjcyODIsImV4cCI6MjA4MjM0MzI4Mn0.Ctu19rwh7J8cvXYHrShvTrWGq_9l5R9vvlQwvs5GTXc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Helper to log Supabase errors descriptively.
 * This prevents the generic [object Object] output by stringifying the error or accessing its message.
 */
const logSupabaseError = (context: string, error: any) => {
  if (!error) return;
  
  const errorMessage = error.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
  const errorDetails = error.details ? ` | Details: ${error.details}` : '';
  const errorCode = error.code ? ` [${error.code}]` : '';
  
  console.error(`${context}${errorCode}: ${errorMessage}${errorDetails}`);
};

export const supabaseService = {
  // Sync user to our database
  async syncUser(firebaseUser: any) {
    try {
      // Upsert user profile
      const { data, error } = await supabase
        .from('users')
        .upsert({
          firebase_uid: firebaseUser.uid,
          email: firebaseUser.email,
          username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User'
        }, { onConflict: 'firebase_uid' })
        .select()
        .maybeSingle();

      if (error) {
        logSupabaseError('Error syncing user to Supabase', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error in syncUser:', error);
      return null;
    }
  },

  // Load user data
  async loadUserData(firebaseUid: string) {
    try {
      const { data: userData, error: dataError } = await supabase
        .from('user_data')
        .select('*')
        .eq('firebase_uid', firebaseUid)
        .maybeSingle();

      if (dataError) {
        logSupabaseError('Error loading user data from Supabase', dataError);
        return null;
      }

      if (!userData) {
        // Create default user_data entry if it doesn't exist
        const { data: newData, error: createError } = await supabase
          .from('user_data')
          .insert({ firebase_uid: firebaseUid })
          .select()
          .maybeSingle();

        if (createError) {
          logSupabaseError('Error creating default user data', createError);
          return null;
        }
        return newData;
      }

      return userData;
    } catch (error) {
      console.error('Unexpected error in loadUserData:', error);
      return null;
    }
  },

  // Update user data
  async updateUserData(firebaseUid: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('user_data')
        .update(updates)
        .eq('firebase_uid', firebaseUid)
        .select()
        .maybeSingle();

      if (error) {
        logSupabaseError('Error updating user data in Supabase', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Unexpected error in updateUserData:', error);
      return null;
    }
  },

  // Save AI generated module
  async saveAIModule(firebaseUid: string, moduleData: any) {
    try {
      const { data, error } = await supabase
        .from('ai_modules')
        .upsert({
          firebase_uid: firebaseUid,
          module_id: moduleData.id || `ai-${Date.now()}`,
          title: moduleData.title,
          category: moduleData.category || 'AI Generated',
          content: moduleData.content
        }, {
          onConflict: 'firebase_uid,module_id'
        })
        .select()
        .maybeSingle();

      if (error) {
        logSupabaseError('Error saving AI module to Supabase', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Unexpected error in saveAIModule:', error);
      return null;
    }
  },

  // Load AI modules for user
  async loadAIModules(firebaseUid: string) {
    try {
      const { data, error } = await supabase
        .from('ai_modules')
        .select('*')
        .eq('firebase_uid', firebaseUid);

      if (error) {
        logSupabaseError('Error loading AI modules from Supabase', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Unexpected error in loadAIModules:', error);
      return [];
    }
  }
};
