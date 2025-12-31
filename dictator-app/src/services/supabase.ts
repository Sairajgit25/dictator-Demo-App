import { createClient } from '@supabase/supabase-js';

// Access environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase Environment Variables! Check your .env file.');
}

// Create the client with the environment variables
export const supabase = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || ''
);

/**
 * Helper to log Supabase errors descriptively.
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
