// Utility to export user data to the data folder
export interface ExportedUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  userType: string;
  address?: string;
  createdAt: string;
}

export const exportUsersToFile = (users: any[]): void => {
  try {
    // Convert users to exportable format (without passwords)
    const exportableUsers: ExportedUser[] = users.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      userType: user.userType,
      address: user.address,
      createdAt: user.createdAt
    }));

    // Create a downloadable file
    const dataStr = JSON.stringify({ users: exportableUsers }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'users-export.json';
    link.click();
    
    console.log('User data exported successfully');
  } catch (error) {
    console.error('Error exporting user data:', error);
  }
};

export const importUsersFromFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        resolve(data.users || []);
      } catch (error) {
        reject(new Error('Invalid file format'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
