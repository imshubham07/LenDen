import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ViewStyle,
  View,
} from 'react-native';
import Animated, {
  AnimatedStyle,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { useAuth } from '@/context/auth-context';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedSvg = Animated.createAnimatedComponent(Svg);
const DOTS_TOP = Array.from({ length: 12 }, (_, index) => index);
const DOTS_BOTTOM = Array.from({ length: 9 }, (_, index) => index);
const RINGS_TOP = [0, 20, 40, 60, 80];
const RINGS_BOTTOM = [0, 18, 36, 54];

export function LoginScreen() {
  const router = useRouter();
  const { login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [focusedField, setFocusedField] = useState<'mobile' | 'password' | null>(null);

  const intro = useSharedValue(0);
  const float = useSharedValue(0);
  const orbit = useSharedValue(0);
  const rings = useSharedValue(0);
  const waveOne = useSharedValue(0);
  const waveTwo = useSharedValue(0);
  const dots = useSharedValue(0);
  const shimmer = useSharedValue(0);
  const press = useSharedValue(0);

  useEffect(() => {
    intro.value = withTiming(1, {
      duration: 850,
      easing: Easing.out(Easing.cubic),
    });

    float.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 4800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );

    orbit.value = withRepeat(withTiming(1, { duration: 14000, easing: Easing.linear }), -1, false);

    rings.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );

    waveOne.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 6000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );

    waveTwo.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 4500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );

    dots.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );

    shimmer.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.cubic) }),
      -1,
      false
    );
  }, [dots, float, intro, orbit, rings, shimmer, waveOne, waveTwo]);

  async function handleLogin() {
    setError('');
    if (!/^\+?[0-9]{5,15}$/.test(mobile.trim()) || password.length < 6) {
      setError('Enter a valid mobile number and a password with at least 6 characters.');
      return;
    }
    if (isSignup && (name.trim().length < 2 || password !== confirmPassword)) {
      setError(name.trim().length < 2 ? 'Enter your full name (at least 2 characters).' : 'Passwords do not match.');
      return;
    }
    setIsSubmitting(true);

    try {
      if (isSignup) await signup(name.trim(), mobile.trim(), password);
      else await login(mobile.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  const backgroundStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(float.value, [0, 1], [0, -8]) },
      { scale: interpolate(float.value, [0, 1], [1, 1.018]) },
    ],
  }));

  const blobStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(float.value, [0, 0.5, 1], [0, 12, 4]) },
      { translateY: interpolate(float.value, [0, 0.5, 1], [0, 6, 15]) },
      { rotate: `${interpolate(orbit.value, [0, 1], [-4, 8])}deg` },
    ],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(rings.value, [0, 1], [0.45, 0.9]),
    transform: [
      { rotate: `${interpolate(orbit.value, [0, 1], [0, 360])}deg` },
      { scale: interpolate(rings.value, [0, 1], [1, 1.045]) },
    ],
  }));

  const reverseRingStyle = useAnimatedStyle(() => ({
    opacity: interpolate(rings.value, [0, 1], [0.32, 0.72]),
    transform: [
      { rotate: `${interpolate(orbit.value, [0, 1], [360, 0])}deg` },
      { scale: interpolate(rings.value, [0, 1], [1.03, 0.98]) },
    ],
  }));

  const glowOneStyle = useAnimatedStyle(() => ({
    opacity: interpolate(float.value, [0, 0.5, 1], [0.16, 0.28, 0.16]),
    transform: [
      { translateX: interpolate(orbit.value, [0, 0.5, 1], [-18, 34, -18]) },
      { translateY: interpolate(float.value, [0, 1], [0, 20]) },
    ],
  }));

  const glowTwoStyle = useAnimatedStyle(() => ({
    opacity: interpolate(float.value, [0, 0.5, 1], [0.12, 0.24, 0.12]),
    transform: [
      { translateX: interpolate(orbit.value, [0, 0.5, 1], [26, -22, 26]) },
      { translateY: interpolate(float.value, [0, 1], [14, -8]) },
    ],
  }));

  const waveOneStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(waveOne.value, [0, 1], [0, -18]) }, { rotate: '-8deg' }],
  }));

  const waveTwoStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(waveTwo.value, [0, 1], [0, 18]) }, { rotate: '-4deg' }],
  }));

  const dotsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(dots.value, [0, 1], [0.42, 0.85]),
    transform: [
      { translateY: interpolate(dots.value, [0, 1], [0, -4]) },
      { translateX: interpolate(orbit.value, [0, 1], [0, 10]) },
    ],
  }));

  const logoGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.4, 1], [0.12, 0.32, 0.12]),
    transform: [
      { translateX: interpolate(orbit.value, [0, 0.5, 1], [-16, 18, -16]) },
      { rotate: `${interpolate(orbit.value, [0, 1], [0, 360])}deg` },
    ],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: intro.value,
    transform: [
      { translateY: interpolate(intro.value, [0, 1], [-28, 0]) },
      { rotate: `${interpolate(intro.value, [0, 1], [-5, 0])}deg` },
      { scale: interpolate(intro.value, [0, 1], [0.82, 1]) },
    ],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: intro.value,
    transform: [{ translateY: interpolate(intro.value, [0, 1], [28, 0]) }],
  }));

  const fieldOneStyle = useAnimatedStyle(() => ({
    opacity: interpolate(intro.value, [0, 0.4, 1], [0, 0, 1]),
    transform: [{ translateX: interpolate(intro.value, [0, 1], [-34, 0]) }],
  }));

  const fieldTwoStyle = useAnimatedStyle(() => ({
    opacity: interpolate(intro.value, [0, 0.55, 1], [0, 0, 1]),
    transform: [{ translateX: interpolate(intro.value, [0, 1], [34, 0]) }],
  }));

  const actionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(intro.value, [0, 0.7, 1], [0, 0, 1]),
    transform: [{ translateY: interpolate(intro.value, [0, 1], [24, 0]) }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(press.value, [0, 1], [1, 0.985]) }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.18, 0.82, 1], [0, 0.18, 0.18, 0]),
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-180, 380]) }, { rotate: '18deg' }],
  }));

  return (
    <View style={styles.screen}>
      <CodedBackground
        backgroundStyle={backgroundStyle}
        blobStyle={blobStyle}
        ringStyle={ringStyle}
        reverseRingStyle={reverseRingStyle}
        waveOneStyle={waveOneStyle}
        waveTwoStyle={waveTwoStyle}
        dotsStyle={dotsStyle}
        glowOneStyle={glowOneStyle}
        glowTwoStyle={glowTwoStyle}
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardArea}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Animated.View style={[styles.logoWrap, logoStyle]}>
              <Animated.View style={[styles.logoGlow, logoGlowStyle]} />
              <Image
                source={require('../assets/images/logWithoutBG.png')}
                resizeMode="contain"
                style={styles.logo}
              />
            </Animated.View>

            <Animated.View style={titleStyle}>
              <View style={styles.titleWrap}>
                <Text style={styles.title}>{isSignup ? 'Create your account' : 'Welcome back!'}</Text>
                <Text style={styles.subtitle}>{isSignup ? 'Sign up to start managing your ledger' : 'Login to continue to your account'}</Text>
              </View>

              <View style={styles.form}>
                {isSignup && <View style={styles.inputBox}>
                  <TextInput accessibilityLabel="Full name" style={styles.input} value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor="#98A6BF" autoCapitalize="words" maxLength={100} editable={!isSubmitting} />
                </View>}
                <Animated.View
                  style={[
                    styles.inputBox,
                    focusedField === 'mobile' ? styles.inputBoxFocused : null,
                    fieldOneStyle,
                  ]}>
                  <Text style={styles.inputIcon}>♙</Text>
                  <TextInput
                    keyboardType="phone-pad"
                    value={mobile}
                    onChangeText={setMobile}
                    onBlur={() => setFocusedField(null)}
                    onFocus={() => setFocusedField('mobile')}
                    placeholder="Mobile number"
                    placeholderTextColor="#98A6BF"
                    style={styles.input}
                  />
                </Animated.View>

                <Animated.View
                  style={[
                    styles.inputBox,
                    focusedField === 'password' ? styles.inputBoxFocused : null,
                    fieldTwoStyle,
                  ]}>
                  <Text style={styles.inputIcon}>▣</Text>
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isSubmitting}
                    value={password}
                    onChangeText={setPassword}
                    onBlur={() => setFocusedField(null)}
                    onFocus={() => setFocusedField('password')}
                    placeholder="Password"
                    placeholderTextColor="#98A6BF"
                    secureTextEntry={!isPasswordVisible}
                    style={styles.input}
                  />
                  <Pressable
                    hitSlop={12}
                    onPress={() => setIsPasswordVisible((current) => !current)}
                    style={styles.eyeButton}>
                    <Text style={styles.eyeText}>{isPasswordVisible ? '◉' : '◎'}</Text>
                  </Pressable>
                </Animated.View>
                {isSignup && <View style={styles.inputBox}>
                  <TextInput accessibilityLabel="Confirm password" style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm password" placeholderTextColor="#98A6BF" secureTextEntry={!isPasswordVisible} autoCapitalize="none" editable={!isSubmitting} />
                </View>}
              </View>

              <Animated.View style={[styles.forgotRow, actionStyle]}>
                {!isSignup ? <Pressable accessibilityRole="button" disabled={isSubmitting} onPress={() => router.push('/forgot-password')}><Text style={styles.forgot}>Forgot password?</Text></Pressable> : null}
                {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
              </Animated.View>

              <AnimatedPressable
                disabled={isSubmitting}
                onPress={handleLogin}
                onPressIn={() => {
                  press.set(withTiming(1, { duration: 100 }));
                }}
                onPressOut={() => {
                  press.set(withTiming(0, { duration: 140 }));
                }}
                style={[styles.loginButton, buttonStyle]}>
                <Animated.View style={[styles.buttonShimmer, shimmerStyle]} />
                <View style={styles.loginButtonContent}>
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.loginText}>{isSignup ? 'Create account' : 'Login'}</Text>
                  )}
                </View>
              </AnimatedPressable>
            </Animated.View>

            <Animated.View style={[styles.signupRow, actionStyle]}>
              <Text style={styles.signupText}>{isSignup ? 'Already have an account?' : "Don't have an account?"}</Text>
              <Pressable accessibilityRole="button" disabled={isSubmitting} hitSlop={8} onPress={() => { setIsSignup(!isSignup); setError(''); setPassword(''); setConfirmPassword(''); }}>
                <Text style={styles.signupLink}>{isSignup ? ' Log in' : ' Sign up'}</Text>
              </Pressable>
            </Animated.View>
            <Pressable accessibilityRole="button" onPress={() => router.push('/privacy-policy')} style={{ padding: 16, alignItems: 'center' }}><Text style={styles.signupText}>Free to use · Privacy Policy</Text></Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

type CodedBackgroundProps = {
  backgroundStyle: AnimatedStyle<ViewStyle>;
  blobStyle: AnimatedStyle<ViewStyle>;
  ringStyle: AnimatedStyle<ViewStyle>;
  reverseRingStyle: AnimatedStyle<ViewStyle>;
  waveOneStyle: AnimatedStyle<ViewStyle>;
  waveTwoStyle: AnimatedStyle<ViewStyle>;
  dotsStyle: AnimatedStyle<ViewStyle>;
  glowOneStyle: AnimatedStyle<ViewStyle>;
  glowTwoStyle: AnimatedStyle<ViewStyle>;
};

function CodedBackground({
  backgroundStyle,
  blobStyle,
  ringStyle,
  reverseRingStyle,
  waveOneStyle,
  waveTwoStyle,
  dotsStyle,
  glowOneStyle,
  glowTwoStyle,
}: CodedBackgroundProps) {
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, backgroundStyle]}>
      <View style={styles.bgBase} />
      <View style={styles.bgRadialTop} />
      <View style={styles.bgRadialBottom} />
      <Animated.View style={[styles.ambientGlowOne, glowOneStyle]} />
      <Animated.View style={[styles.ambientGlowTwo, glowTwoStyle]} />

      <Animated.View style={[styles.dotGrid, styles.dotGridTop, dotsStyle]}>
        {DOTS_TOP.map((dot) => (
          <View key={dot} style={styles.dot} />
        ))}
      </Animated.View>

      <Animated.View style={[styles.dotGrid, styles.dotGridBottom, dotsStyle]}>
        {DOTS_BOTTOM.map((dot) => (
          <View key={dot} style={styles.dot} />
        ))}
      </Animated.View>

      <Animated.View style={[styles.ringWrapTop, ringStyle]}>
        {RINGS_TOP.map((inset) => (
          <View key={inset} style={[styles.ring, { inset }]} />
        ))}
      </Animated.View>

      <Animated.View style={[styles.ringWrapBottom, reverseRingStyle]}>
        {RINGS_BOTTOM.map((inset) => (
          <View key={inset} style={[styles.ring, { inset }]} />
        ))}
      </Animated.View>

      <Animated.View style={[styles.blob, blobStyle]} />

      <View style={styles.waves}>
        <AnimatedSvg
          width="200%"
          height="100%"
          viewBox="0 0 800 340"
          preserveAspectRatio="none"
          style={[styles.waveSvg, styles.waveSvgOne, waveOneStyle]}>
          <Defs>
            <LinearGradient id="loginWaveOne" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#1F4FD8" />
              <Stop offset="55%" stopColor="#1A9C6B" />
              <Stop offset="100%" stopColor="#3FE14A" />
            </LinearGradient>
          </Defs>
          <Path
            fill="url(#loginWaveOne)"
            d="M0,120 C120,40 220,40 340,110 C460,180 560,180 680,100 C740,60 780,50 800,55 L800,340 L0,340 Z"
          />
        </AnimatedSvg>

        <AnimatedSvg
          width="200%"
          height="100%"
          viewBox="0 0 800 340"
          preserveAspectRatio="none"
          style={[styles.waveSvg, styles.waveSvgTwo, waveTwoStyle]}>
          <Defs>
            <LinearGradient id="loginWaveTwo" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#1541B0" />
              <Stop offset="55%" stopColor="#12704F" />
              <Stop offset="100%" stopColor="#28B23A" />
            </LinearGradient>
          </Defs>
          <Path
            fill="url(#loginWaveTwo)"
            opacity={0.55}
            d="M0,170 C140,110 260,110 380,160 C500,210 600,210 700,150 C750,120 780,110 800,115 L800,340 L0,340 Z"
          />
        </AnimatedSvg>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#001234',
  },
  bgBase: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#060B1E',
  },
  bgRadialTop: {
    position: 'absolute',
    top: -140,
    left: -60,
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: 'rgba(10, 21, 48, 0.92)',
  },
  bgRadialBottom: {
    position: 'absolute',
    left: -40,
    right: -40,
    bottom: -180,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(4, 8, 26, 0.78)',
  },
  ambientGlowOne: {
    position: 'absolute',
    top: 86,
    left: 18,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(23, 114, 223, 0.34)',
  },
  ambientGlowTwo: {
    position: 'absolute',
    right: -80,
    bottom: 126,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(70, 225, 90, 0.2)',
  },
  dotGrid: {
    position: 'absolute',
    width: 70,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  dotGridTop: {
    top: 46,
    left: 24,
  },
  dotGridBottom: {
    right: 24,
    bottom: 190,
    width: 52,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2B5FD9',
    opacity: 0.55,
  },
  ringWrapTop: {
    position: 'absolute',
    top: 140,
    right: -70,
    width: 260,
    height: 260,
  },
  ringWrapBottom: {
    position: 'absolute',
    right: -70,
    bottom: 60,
    width: 220,
    height: 220,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.35)',
  },
  blob: {
    position: 'absolute',
    top: -20,
    left: -40,
    width: 200,
    height: 220,
    borderBottomRightRadius: 90,
    borderBottomLeftRadius: 60,
    backgroundColor: '#123A63',
    experimental_backgroundImage: 'linear-gradient(160deg, #1B8A5A 0%, #123A63 70%)',
  },
  waves: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -42,
    height: 320,
    overflow: 'hidden',
  },
  waveSvg: {
    position: 'absolute',
    bottom: 0,
    left: '-50%',
  },
  waveSvgOne: {
    opacity: 1,
  },
  waveSvgTwo: {
    opacity: 0.9,
  },
  safeArea: {
    flex: 1,
  },
  keyboardArea: {
    flex: 1,
    paddingHorizontal: 26,
  },
  content: {
    flexGrow: 1,
    paddingVertical: 24,
    justifyContent: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 210,
    height: 120,
    borderRadius: 80,
    backgroundColor: 'rgba(30, 160, 255, 0.32)',
  },
  logo: {
    width: 220,
    height: 164,
  },
  titleWrap: {
    alignItems: 'center',
    marginTop: 2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#A8B4CC',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    gap: 12,
    marginTop: 28,
  },
  inputBox: {
    minHeight: 55,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#223B65',
    backgroundColor: 'rgba(7, 27, 60, 0.82)',
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputBoxFocused: {
    borderColor: '#78EC34',
    backgroundColor: 'rgba(9, 34, 74, 0.9)',
    shadowColor: '#78EC34',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 3,
  },
  inputIcon: {
    width: 24,
    color: '#79EA35',
    fontSize: 18,
    fontWeight: '700',
  },
  input: {
    flex: 1,
    minHeight: 53,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 0,
  },
  eyeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeText: {
    color: '#9DAAC3',
    fontSize: 18,
  },
  forgotRow: {
    minHeight: 24,
    marginTop: 12,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  forgot: {
    color: '#75EA35',
    fontSize: 12,
    fontWeight: '700',
  },
  error: {
    alignSelf: 'flex-start',
    color: '#FF8B8B',
    fontSize: 13,
    fontWeight: '600',
  },
  loginButton: {
    minHeight: 58,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 16,
    backgroundColor: '#1EA0FF',
    experimental_backgroundImage: 'linear-gradient(100deg, #80EA4E 0%, #2BC7D6 52%, #1F91FF 100%)',
  },
  buttonShimmer: {
    position: 'absolute',
    top: -18,
    bottom: -18,
    width: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  loginButtonContent: {
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  signupText: {
    color: '#C2CBDD',
    fontSize: 14,
    fontWeight: '500',
  },
  signupLink: {
    color: '#78EC34',
    fontSize: 14,
    fontWeight: '800',
  },
});
