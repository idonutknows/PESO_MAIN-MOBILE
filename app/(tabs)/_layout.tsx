import { Tabs } from 'expo-router';
import { StyleSheet, View, Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function TabLayout() {
  const { user, isLoading, hasJobSeekerProfile, hasCheckedProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0a7ea4',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              {focused && (
                <LinearGradient
                  colors={['#0a7ea4', '#0891b2']}
                  style={styles.activeIconBg}
                />
              )}
              <MaterialIcons
                name="home"
                size={22}
                color={focused ? '#ffffff' : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              {focused && (
                <LinearGradient
                  colors={['#0a7ea4', '#0891b2']}
                  style={styles.activeIconBg}
                />
              )}
              <MaterialIcons
                name="work"
                size={22}
                color={focused ? '#ffffff' : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="resume"
        options={{
          title: 'Resume',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              {focused && (
                <LinearGradient
                  colors={['#0a7ea4', '#0891b2']}
                  style={styles.activeIconBg}
                />
              )}
              <MaterialIcons
                name="description"
                size={22}
                color={focused ? '#ffffff' : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: 'Applications',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              {focused && (
                <LinearGradient
                  colors={['#0a7ea4', '#0891b2']}
                  style={styles.activeIconBg}
                />
              )}
              <MaterialIcons
                name="assignment"
                size={22}
                color={focused ? '#ffffff' : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              {focused && (
                <LinearGradient
                  colors={['#0a7ea4', '#0891b2']}
                  style={styles.activeIconBg}
                />
              )}
              <MaterialIcons
                name="person"
                size={22}
                color={focused ? '#ffffff' : color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 88 : 72,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingTop: 8,
    paddingHorizontal: 12,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  tabItem: {
    paddingVertical: 4,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconContainerActive: {
    width: 56,
    height: 32,
  },
  activeIconBg: {
    ...StyleSheet.absoluteFill,
    borderRadius: 16,
  },
});
