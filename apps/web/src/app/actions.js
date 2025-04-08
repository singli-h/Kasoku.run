'use server';

/**
 * Example server action to test that server actions are enabled
 * This action can be used to update user profile data after they sign in with Clerk
 */
export async function updateUserProfile(formData) {
  try {
    // In a real implementation, you would perform database operations here
    // For example, updating the user profile in your Supabase database
    console.log('Server action called with data:', formData);
    
    // Here you could access the user info and update their profile
    // const { userId } = auth();
    // await db.user.update({ where: { id: userId }, data: { ... } })
    
    return { success: true };
  } catch (error) {
    console.error('Error in server action:', error);
    return { error: error.message };
  }
} 