import React, { useState, useEffect } from 'react';
import {
    Lock, Bell, Eye, EyeOff,
    Monitor, Globe, Moon, Sun, Laptop,
    Save, Loader2, Check, ShieldCheck, Activity
} from 'lucide-react';
import { authService } from '../../services/authService';
import auditService, { AuditEvent } from '../../services/auditService';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/shared/PageHeader';
import {
    Button,
    Card, CardContent, CardDescription, CardHeader, CardTitle,
    Input,
    Label,
    Switch,
    Tabs, TabsContent, TabsList, TabsTrigger,
    Textarea
} from '../../components/ui';
import { FormField } from '../../components/shared/FormField';
import { useForm } from '../../hooks/useForm';

const UserSettings: React.FC = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [securityActivity, setSecurityActivity] = useState<AuditEvent[]>([]);

    const {
        values: passwordData,
        errors: passwordErrors,
        handleChange: handlePasswordInputChange,
        handleBlur: handlePasswordBlur,
        validateForm: validatePasswordForm,
        resetForm: resetPasswordForm
    } = useForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    }, {
        currentPassword: { required: true },
        newPassword: { required: true, minLength: 8 },
        confirmPassword: {
            required: true,
            custom: (val, vals) => val !== vals.newPassword ? 'Passwords do not match' : null
        }
    });

    const [settings, setSettings] = useState({
        notifications: {
            emailAlerts: true,
            pushNotifications: false,
            assetReminders: true,
            maintenanceAlerts: true
        },
        appearance: {
            theme: 'light',
            language: 'en'
        },
        security: {
            twoFactor: false
        }
    });

    useEffect(() => {
        loadSettings();
        loadSecurityActivity();
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        if (settings.appearance.theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.classList.add(systemTheme);
        } else {
            root.classList.add(settings.appearance.theme);
        }
    }, [settings.appearance.theme]);

    const loadSettings = async () => {
        try {
            setFetching(true);
            const profile = await authService.getProfile();
            if (profile.settings) {
                setSettings({
                    ...settings,
                    ...profile.settings,
                    security: profile.settings.security || { twoFactor: false }
                });
            }
        } catch (error) {
            console.error('Failed to load settings', error);
        } finally {
            setFetching(false);
        }
    };

    const loadSecurityActivity = async () => {
        try {
            const activity = await auditService.getMyActivity();
            setSecurityActivity(activity);
        } catch (error) {
            console.error('Failed to load security activity', error);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validatePasswordForm()) return;

        try {
            setLoading(true);
            await authService.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            showToast('Password changed successfully', 'success');
            resetPasswordForm();
        } catch (error: any) {
            showToast(error.message || 'Failed to change password', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleNotification = (key: keyof typeof settings.notifications) => {
        setSettings({
            ...settings,
            notifications: {
                ...settings.notifications,
                [key]: !settings.notifications[key]
            }
        });
    };

    const handleToggleSecurity = (key: keyof typeof settings.security) => {
        setSettings({
            ...settings,
            security: {
                ...settings.security,
                [key]: !settings.security[key]
            }
        });
    };

    const handleSaveSettings = async () => {
        try {
            setLoading(true);
            await authService.updateProfile({ settings });
            showToast('Settings saved successfully', 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to save settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const handleLogoutOthers = async () => {
        try {
            setLoading(true);
            await authService.logoutOthers();
            showToast('Logged out from other sessions', 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to logout from other sessions', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Settings"
                description="Manage your account security, notifications, and application preferences"
            />

            <Tabs defaultValue="security" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                    <TabsTrigger value="security" className="gap-2">
                        <Lock className="h-4 w-4" />
                        Security
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2">
                        <Bell className="h-4 w-4" />
                        Notifications
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="gap-2">
                        <Monitor className="h-4 w-4" />
                        Appearance
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    {/* Security Settings */}
                    <TabsContent value="security">
                        <div className="grid gap-6 lg:grid-cols-2">
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Change Password</CardTitle>
                                        <CardDescription>
                                            We recommend using a unique password that you don't use elsewhere.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handlePasswordChange} className="space-y-4 pt-2">
                                            <FormField
                                                id="currentPassword"
                                                label="Current Password"
                                                required
                                                error={passwordErrors.currentPassword}
                                            >
                                                <div className="relative">
                                                    <Input
                                                        id="currentPassword"
                                                        type={showPassword ? "text" : "password"}
                                                        value={passwordData.currentPassword}
                                                        onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                                                        onBlur={() => handlePasswordBlur('currentPassword')}
                                                        placeholder="••••••••"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                    >
                                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </FormField>

                                            <FormField
                                                id="newPassword"
                                                label="New Password"
                                                required
                                                error={passwordErrors.newPassword}
                                                hint="Minimum 8 characters"
                                            >
                                                <div className="relative">
                                                    <Input
                                                        id="newPassword"
                                                        type={showNewPassword ? "text" : "password"}
                                                        value={passwordData.newPassword}
                                                        onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                                                        onBlur={() => handlePasswordBlur('newPassword')}
                                                        placeholder="••••••••"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                    >
                                                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </FormField>

                                            <FormField
                                                id="confirmPassword"
                                                label="Confirm New Password"
                                                required
                                                error={passwordErrors.confirmPassword}
                                            >
                                                <Input
                                                    id="confirmPassword"
                                                    type="password"
                                                    value={passwordData.confirmPassword}
                                                    onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                                                    onBlur={() => handlePasswordBlur('confirmPassword')}
                                                    placeholder="••••••••"
                                                />
                                            </FormField>

                                            <div className="pt-2">
                                                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                                                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                                    Update Password
                                                </Button>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Two-Factor Authentication</CardTitle>
                                        <CardDescription>
                                            Add an extra layer of security to your account.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                                    <Label>Authenticator App</Label>
                                                </div>
                                                <p className="text-sm text-muted-foreground">Use an app like Google Authenticator.</p>
                                            </div>
                                            <Switch
                                                checked={settings.security.twoFactor}
                                                onCheckedChange={() => handleToggleSecurity('twoFactor')}
                                            />
                                        </div>
                                        <Button onClick={handleSaveSettings} variant="outline" className="w-full">
                                            Configure 2FA
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-6">
                                <Card className="border-destructive/20 bg-destructive/5 h-fit">
                                    <CardHeader>
                                        <CardTitle className="text-destructive">Session Management</CardTitle>
                                        <CardDescription>
                                            Logging out of other sessions will terminate access from all other devices.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button variant="outline" onClick={handleLogoutOthers} disabled={loading} className="w-full sm:w-auto">
                                            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Sign out from all other devices"}
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-blue-500" />
                                            Recent Security Activity
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {securityActivity.length > 0 ? (
                                                securityActivity.map((item) => (
                                                    <div key={item.id} className="flex flex-col gap-1 pb-3 border-b last:border-0 last:pb-0">
                                                        <p className="text-sm font-medium capitalize">
                                                            {item.action.replace('_', ' ')}
                                                            {item.metadata?.field ? ` (${item.metadata.field})` : ''}
                                                        </p>
                                                        <div className="flex justify-between text-xs text-muted-foreground">
                                                            <span>{new Date(item.createdAt).toLocaleString()}</span>
                                                            <span>{item.ipAddress || 'Internal'}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Notification Settings */}
                    <TabsContent value="notifications">
                        <Card>
                            <CardHeader>
                                <CardTitle>Notification Preferences</CardTitle>
                                <CardDescription>
                                    Control how and when you receive alerts from the system.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between space-x-2">
                                        <div className="space-y-0.5">
                                            <Label>Email Alerts</Label>
                                            <p className="text-sm text-muted-foreground">Receive important updates via email.</p>
                                        </div>
                                        <Switch
                                            checked={settings.notifications.emailAlerts}
                                            onCheckedChange={() => handleToggleNotification('emailAlerts')}
                                        />
                                    </div>
                                    <hr />
                                    <div className="flex items-center justify-between space-x-2">
                                        <div className="space-y-0.5">
                                            <Label>Push Notifications</Label>
                                            <p className="text-sm text-muted-foreground">Receive real-time desktop notifications.</p>
                                        </div>
                                        <Switch
                                            checked={settings.notifications.pushNotifications}
                                            onCheckedChange={() => handleToggleNotification('pushNotifications')}
                                        />
                                    </div>
                                    <hr />
                                    <div className="flex items-center justify-between space-x-2">
                                        <div className="space-y-0.5">
                                            <Label>Asset Reminders</Label>
                                            <p className="text-sm text-muted-foreground">Alerts for assets assigned to you or nearing disposal.</p>
                                        </div>
                                        <Switch
                                            checked={settings.notifications.assetReminders}
                                            onCheckedChange={() => handleToggleNotification('assetReminders')}
                                        />
                                    </div>
                                    <hr />
                                    <div className="flex items-center justify-between space-x-2">
                                        <div className="space-y-0.5">
                                            <Label>Maintenance Alerts</Label>
                                            <p className="text-sm text-muted-foreground">Stay informed about scheduled hardware maintenance.</p>
                                        </div>
                                        <Switch
                                            checked={settings.notifications.maintenanceAlerts}
                                            onCheckedChange={() => handleToggleNotification('maintenanceAlerts')}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button onClick={handleSaveSettings} disabled={loading}>
                                        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                                        Save Preferences
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Appearance & General Settings */}
                    <TabsContent value="appearance">
                        <Card>
                            <CardHeader>
                                <CardTitle>Application Settings</CardTitle>
                                <CardDescription>
                                    Customize your viewing experience.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        <Label>Theme</Label>
                                        <div className="grid grid-cols-3 gap-4">
                                            <button
                                                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${settings.appearance.theme === 'light' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground'}`}
                                                onClick={() => setSettings({ ...settings, appearance: { ...settings.appearance, theme: 'light' } })}
                                            >
                                                <Sun className={`h-6 w-6 ${settings.appearance.theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
                                                <span className="text-xs font-medium">Light</span>
                                            </button>
                                            <button
                                                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${settings.appearance.theme === 'dark' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground'}`}
                                                onClick={() => setSettings({ ...settings, appearance: { ...settings.appearance, theme: 'dark' } })}
                                            >
                                                <Moon className={`h-6 w-6 ${settings.appearance.theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />
                                                <span className="text-xs font-medium">Dark</span>
                                            </button>
                                            <button
                                                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${settings.appearance.theme === 'system' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground'}`}
                                                onClick={() => setSettings({ ...settings, appearance: { ...settings.appearance, theme: 'system' } })}
                                            >
                                                <Laptop className={`h-6 w-6 ${settings.appearance.theme === 'system' ? 'text-primary' : 'text-muted-foreground'}`} />
                                                <span className="text-xs font-medium">System</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2 pt-2">
                                        <Label htmlFor="language">Display Language</Label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <select
                                                id="language"
                                                className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                value={settings.appearance.language}
                                                onChange={(e) => setSettings({ ...settings, appearance: { ...settings.appearance, language: e.target.value } })}
                                            >
                                                <option value="en">English (US)</option>
                                                <option value="es">Spanish</option>
                                                <option value="fr">French</option>
                                                <option value="de">German</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button onClick={handleSaveSettings} disabled={loading}>
                                        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                                        Save Changes
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
};

export default UserSettings;
