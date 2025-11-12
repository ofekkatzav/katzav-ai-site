import React, { useState, useEffect, useRef, createContext, useContext, forwardRef } from 'react';
import { 
  Bot, MessageCircle, Workflow, Phone, Server, Database, CheckCircle, AlertCircle, Loader2, 
  ArrowLeft, ChevronDown, X, Menu, Users, Briefcase, Zap, BarChart2,
  Slack, ShoppingCart, CreditCard, Mail, Calendar, PhoneCall, MapPin, Github, Link,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import KatzavLogo from './katzav-logo.svg';

// --- Utility Functions ---

/**
 * Merges Tailwind classes conditionally.
 * Replaces clsx + tailwind-merge for single-file simplicity.
 */
function cn(...inputs) {
  const classSet = new Set();
  inputs.forEach(input => {
    if (typeof input === 'string') {
      input.split(' ').forEach(cls => {
        if (cls.trim()) classSet.add(cls.trim());
      });
    } else if (typeof input === 'object' && input !== null) {
      Object.keys(input).forEach(key => {
        if (input[key]) classSet.add(key);
      });
    }
  });

  // Basic tailwind-merge logic (last one wins for conflicting props like p-2 vs p-4)
  const classMap = new Map();
  classSet.forEach(cls => {
    const key = cls.split('-')[0]; // e.g., 'p', 'm', 'bg'
    classMap.set(key, cls);
  });

  return Array.from(classMap.values()).join(' ');
}

// --- Webhook Configuration & Event Tracking ---

const WEBHOOK_MAP = {
  'default_lead': 'https://n8n.srv942917.hstgr.cloud/webhook/new-lead',
  'form_submit_consultation': 'https://n8n.srv942917.hstgr.cloud/webhook/consultation-lead',
  'diagnostic_lead_captured': 'https://n8n.srv942917.hstgr.cloud/webhook/diagnostic-lead',
  'whatsapp_button_click': 'https://n8n.srv942917.hstgr.cloud/webhook/whatsapp-click',
  'hero_cta_click': 'https://n8n.srv942917.hstgr.cloud/webhook/hero-cta'
};

/**
 * Central event tracking function for all webhooks
 * @param {string} eventName - Unique event identifier
 * @param {object} payload - Data to send
 */
async function trackEvent(eventName, payload = {}) {
  const url = WEBHOOK_MAP[eventName] || WEBHOOK_MAP['default_lead'];
  
  const eventData = {
    ...payload,
    event: eventName,
    timestamp: new Date().toISOString(),
    path: window.location.pathname
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });
    
    if (!response.ok) {
      console.warn(`Webhook event '${eventName}' failed to send.`);
    }
    
    console.log(`Event '${eventName}' tracked successfully.`);
    return { ok: true };

  } catch (error) {
    console.error(`Error tracking event '${eventName}':`, error);
    throw new Error('Failed to track event');
  }
}

// --- API Call Functions ---

/**
 * Calls the n8n webhook for the Diagnostic Widget.
 * The AI processing now happens on the server via n8n.
 * @param {object} formData The collected data from the multi-step form
 * @returns {Promise<object>} The parsed JSON response from n8n
 */
async function callGeminiAPI(formData) {
  // קריאה ל-n8n webhook במקום ישירות ל-Gemini
  // כל הלוגיקה של AI רצה עכשיו בשרת דרך n8n
  const n8nWebhookUrl = 'https://n8n.srv942917.hstgr.cloud/webhook/diagnostic-agent';
  
  // Debug: הצג מה נשלח
  console.log('📤 שולח ל-n8n את הנתונים הבאים:', formData);
  
  try {
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      throw new Error(`שגיאת שרת: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Check for invalid input error
    if (!data.success && data.error === 'INVALID_INPUT') {
      throw new Error(data.message || 'הפרטים שהוזנו אינם מספיקים ליצירת אפיון מדויק');
    }
    
    if (!data.success) {
      throw new Error(data.message || 'אירעה שגיאה בעיבוד הבקשה');
    }
    
    // החזרת התוצאה בפורמט שהאתר מצפה לו
    return data.result;
    
  } catch (error) {
    console.error("Error calling n8n webhook:", error);
    throw new Error(`קריאת ה-AI נכשלה: ${error.message}`);
  }
}

// --- Re-implemented shadcn/ui Components (for Single File) ---

// 1. Button
const buttonVariants = ({ variant, size, className }) => {
  const base = "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  
  const variants = {
    default: "bg-emerald-600 text-white hover:bg-emerald-600/90",
    dark: "bg-gray-900 text-white hover:bg-gray-900/90",
    destructive: "bg-red-600 text-white hover:bg-red-600/90",
    outline: "border border-gray-300 bg-white hover:bg-gray-100 hover:text-gray-900",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-100/80",
    ghost: "hover:bg-gray-100 hover:text-gray-900",
    link: "text-emerald-600 underline-offset-4 hover:underline",
  };

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  };

  return cn(
    base,
    variants[variant || 'default'],
    sizes[size || 'default'],
    className
  );
};

const Button = forwardRef(({ className, variant, size, asChild = false, children, ...props }, ref) => {
  if (asChild) {
    const child = React.Children.only(children);
    return React.cloneElement(child, {
      className: cn(buttonVariants({ variant, size, className }), child.props.className),
      ref: ref,
      ...props,
    });
  }
  return (
    <button
      className={buttonVariants({ variant, size, className })}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  );
});

// 2. Card
const Card = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm", className)}
    {...props}
  />
));
const CardHeader = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
const CardTitle = forwardRef(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  >
    {children}
  </h3>
));
const CardDescription = forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-600", className)}
    {...props}
  />
));
const CardContent = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
const CardFooter = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));

// 3. Input
const Input = forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

// 4. Textarea
const Textarea = forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

// 5. Badge
const badgeVariants = ({ variant, className }) => {
  const base = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2";
  const variants = {
    default: "border-transparent bg-emerald-600 text-white hover:bg-emerald-600/80",
    secondary: "border-transparent bg-gray-200 text-gray-900 hover:bg-gray-200/80",
    outline: "text-gray-900 border-gray-300",
  };
  return cn(base, variants[variant || 'default'], className);
}
const Badge = ({ className, variant, ...props }) => {
  return (
    <div className={badgeVariants({ variant, className })} {...props} />
  );
};

// 6. Accordion
const AccordionContext = createContext({ value: null, setValue: () => {} });
const Accordion = ({ children, ...props }) => {
  const [value, setValue] = useState(null);
  return (
    <AccordionContext.Provider value={{ value, setValue }}>
      <div {...props}>{children}</div>
    </AccordionContext.Provider>
  );
};
const AccordionItem = forwardRef(({ children, value, className, ...props }, ref) => (
  <div ref={ref} className={cn("border-b", className)} {...props}>
    {React.Children.map(children, child =>
      React.cloneElement(child, { 'data-value': value })
    )}
  </div>
));
const AccordionTrigger = forwardRef(({ children, className, 'data-value': dataValue, ...props }, ref) => {
  const { value, setValue } = useContext(AccordionContext);
  const isOpen = value === dataValue;
  return (
    <button
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )}
      onClick={() => setValue(isOpen ? null : dataValue)}
      data-state={isOpen ? 'open' : 'closed'}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </button>
  );
});
const AccordionContent = forwardRef(({ children, className, 'data-value': dataValue, ...props }, ref) => {
  const { value } = useContext(AccordionContext);
  const isOpen = value === dataValue;
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className={cn("overflow-hidden text-sm transition-all", className)}
          {...props}
        >
          <div className="pb-4 pt-0">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// 7. Sheet
const SheetContext = createContext({ open: false, setOpen: () => {} });
const Sheet = ({ children }) => {
  const [open, setOpen] = useState(false);
  return (
    <SheetContext.Provider value={{ open, setOpen }}>
      {children}
    </SheetContext.Provider>
  );
};
const SheetTrigger = ({ children, asChild = false, ...props }) => {
  const { setOpen } = useContext(SheetContext);
  if (asChild) {
    const child = React.Children.only(children);
    return React.cloneElement(child, {
      onClick: (e) => {
        setOpen(true);
        if (child.props.onClick) child.props.onClick(e);
      },
      ...props,
    });
  }
  return (
    <Button onClick={() => setOpen(true)} {...props}>
      {children}
    </Button>
  );
};
const SheetContent = ({ children, side = 'right', className, ...props }) => {
  const { open, setOpen } = useContext(SheetContext);
  const sideClasses = {
    bottom: "inset-x-0 bottom-0 border-t",
    top: "inset-x-0 top-0 border-b",
    left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
    right: "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
  };
  const motionVariants = {
    bottom: { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } },
    top: { initial: { y: '-100%' }, animate: { y: 0 }, exit: { y: '-100%' } },
    left: { initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '-100%' } },
    right: { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } },
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={motionVariants[side].initial}
            animate={motionVariants[side].animate}
            exit={motionVariants[side].exit}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              "fixed z-50 gap-4 bg-white p-6 shadow-lg",
              sideClasses[side],
              className
            )}
            {...props}
          >
            {children}
            <SheetClose className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:pointer-events-none">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </SheetClose>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
const SheetClose = ({ children, ...props }) => {
  const { setOpen } = useContext(SheetContext);
  const child = React.Children.only(children);
  return React.cloneElement(child, {
    onClick: (e) => {
      setOpen(false);
      if (child.props.onClick) child.props.onClick(e);
    },
    ...props,
  });
};


// --- Page Sections / Components ---

const Header = () => {
  const navLinks = [
    { name: "שירותים", href: "#services" },
    { name: "איך זה עובד", href: "#how-it-works" },
    { name: "פרויקטים נבחרים", href: "#case-studies" },
    { name: "שאלות נפוצות", href: "#faq" },
    { name: "יצירת קשר", href: "#contact" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur-sm" dir="rtl">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <a href="#" className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-black rounded-full p-2">
              <img src={KatzavLogo} alt="Katzav AI" className="h-8 w-8" />
            </div>
          </motion.div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">KATZAV AI</span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex md:items-center md:gap-6 lg:gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-emerald-600"
            >
              {link.name}
            </a>
          ))}
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="text-emerald-600 hover:text-emerald-600">
              <a href="https://wa.me/972528023630" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 ml-2" />
                דברו איתנו בוואטסאפ
              </a>
            </Button>
            <Button asChild>
              <a href="#consultation">בואו נדבר</a>
            </Button>
          </div>
        </nav>

        {/* Mobile Nav Trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">פתח תפריט</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-xs" dir="rtl">
            <nav className="flex h-full flex-col justify-between">
              <div className="flex flex-col space-y-4 pt-8">
                {navLinks.map((link) => (
                  <SheetClose key={link.name}>
                    <a
                      href={link.href}
                      className="block py-2 text-lg font-medium text-gray-700 transition-colors hover:text-emerald-600"
                    >
                      {link.name}
                    </a>
                  </SheetClose>
                ))}
              </div>
              <div className="flex flex-col space-y-3 border-t pt-4">
                <Button asChild>
                  <a href="#consultation">בואו נדבר</a>
                </Button>
                <Button asChild variant="ghost" className="text-emerald-600 hover:text-emerald-600">
                  <a href="https://wa.me/972528023630" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4 ml-2" />
                    דברו איתנו בוואטסאפ
                  </a>
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

const Hero = () => (
  <motion.section
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7, ease: "easeOut" }}
    className="w-full bg-gradient-to-b from-gray-50 to-white py-20 md:py-32"
    dir="rtl"
  >
    <div className="container mx-auto max-w-4xl px-4 text-center">
      {/* Logo */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="flex justify-center mb-8"
      >
        <div className="bg-black rounded-full p-4 shadow-2xl">
          <img src={KatzavLogo} alt="Katzav AI" className="h-16 w-16 md:h-20 md:w-20" />
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-gray-900 mb-4">
          KATZAV AI
        </h1>
        <Badge variant="secondary" className="mb-6">
          אוטומציות ובוטי WhatsApp שמביאים תוצאות — מהר.
        </Badge>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl mt-6">
          צ׳אטבוט WhatsApp ואוטומציות שמורידים עומס ומעלים המרות
        </h2>
        <p className="mt-6 text-lg leading-8 text-gray-600 md:text-xl">
          אנחנו בונים תהליכים אוטומטיים ובוטים חכמים שחוסכים לכם זמן יקר, משפרים את שירות הלקוחות ומגדילים את שורת הרווח.
        </p>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-10 flex items-center justify-center gap-x-4"
      >
        <Button asChild size="lg">
          <a href="#consultation">
            <Send className="h-5 w-5 ml-2" />
            בואו נדבר על אוטומציה
          </a>
        </Button>
        <Button asChild size="lg" variant="outline">
          <a href="https://wa.me/972528023630" target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-5 w-5 ml-2" />
            שלחו הודעה בוואטסאפ
          </a>
        </Button>
      </motion.div>
    </div>
  </motion.section>
);

const DiagnosticWidget = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    problem: '',
    goal: '',
    currentSystem: '',
    name: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  
  const totalSteps = 4; // 3 questions + 1 lead form

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = (e) => {
    e.preventDefault();
    setError(null);

    // Basic validation before next step
    if (step === 1 && !formData.problem) {
      setError("אנא תארו את הבעיה.");
      return;
    }
    if (step === 2 && !formData.goal) {
      setError("אנא הגדירו את המטרה.");
      return;
    }
    if (step === 3 && !formData.currentSystem) {
      setError("אנא ציינו באילו מערכות אתם משתמשים.");
      return;
    }
    
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
      setError(null);
    }
  };

  const handleDiagnoseSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Final lead validation
    if (!formData.name || !formData.email || !formData.phone) {
      setError("אנא מלאו את כל הפרטים כדי לקבל את האפיון.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // קריאה ל-n8n - כל המידע נשלח ונשמר שם (כולל הליד)
      const apiResult = await callGeminiAPI(formData);
      setResult(apiResult);
      setStep(prev => prev + 1); // Move to result step
      // Don't set submitted yet - let user see the results first!
      
    } catch (err) {
      console.error("Error in handleDiagnoseSubmit:", err);
      
      // Special handling for invalid input
      if (err.message.includes('הפרטים שהוזנו אינם מספיקים')) {
        setError("הפרטים שהוזנו אינם מספיקים ליצירת אפיון מדויק. אנא נסו שוב עם תיאור מפורט יותר של הבעיה והמטרה.");
      } else {
        setError(err.message || "אירעה שגיאה. אנא נסו שוב.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Step Content ---
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <motion.div key={1} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <label htmlFor="problem" className="block text-sm font-medium text-gray-700">שלב 1: מה הבעיה?</label>
            <p className="text-xs text-gray-500 mb-2">תארו בקצרה את האתגר או התהליך הידני שאתם רוצים לפתור.</p>
            <Textarea
              id="problem"
              name="problem"
              rows={3}
              value={formData.problem}
              onChange={handleChange}
              placeholder="למשל: &#10;כל ליד שמגיע מהאתר דורש 5 דקות עבודה ידנית של העתק-הדבק למערכת..."
            />
            <Button onClick={handleNext} className="mt-4 w-full">המשך</Button>
          </motion.div>
        );
      case 2:
        return (
          <motion.div key={2} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <label htmlFor="goal" className="block text-sm font-medium text-gray-700">שלב 2: מה המטרה?</label>
            <p className="text-xs text-gray-500 mb-2">מה הייתם רוצים שיקרה באופן אידיאלי?</p>
            <Textarea
              id="goal"
              name="goal"
              rows={3}
              value={formData.goal}
              onChange={handleChange}
              placeholder="למשל: &#10;שהליד ייכנס אוטומטית ל-CRM, יישלח לצוות ב-Slack, והלקוח יקבל SMS..."
            />
            <div className="flex gap-2 mt-4">
              <Button onClick={handleBack} variant="outline" className="w-1/3">אחורה</Button>
              <Button onClick={handleNext} className="w-2/3">המשך</Button>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div key={3} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <label htmlFor="currentSystem" className="block text-sm font-medium text-gray-700">שלב 3: באילו מערכות אתם משתמשים?</label>
            <p className="text-xs text-gray-500 mb-2">ציינו שמות של תוכנות עיקריות (אם יש).</p>
            <Textarea
              id="currentSystem"
              name="currentSystem"
              rows={3}
              value={formData.currentSystem}
              onChange={handleChange}
              placeholder="למשל: &#10;אנחנו משתמשים ב-Pipedrive, Google Sheets ו-Wix..."
            />
            <div className="flex gap-2 mt-4">
              <Button onClick={handleBack} variant="outline" className="w-1/3">אחורה</Button>
              <Button onClick={handleNext} className="w-2/3">קבלו אפיון</Button>
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div key={4} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <h4 className="text-md font-semibold text-gray-800">שלב אחרון!</h4>
            <p className="text-sm text-gray-600 mb-3">האפיון הראשוני מוכן. אנא השאירו פרטים וקבלו אותו מיידית.</p>
            <form onSubmit={handleDiagnoseSubmit} className="space-y-3">
              <Input id="name" name="name" type="text" placeholder="שם מלא" value={formData.name} onChange={handleChange} required />
              <Input id="email" name="email" type="email" placeholder="אימייל" value={formData.email} onChange={handleChange} required />
              <Input id="phone" name="phone" type="tel" placeholder="טלפון" value={formData.phone} onChange={handleChange} required />
              <div className="flex gap-2 pt-2">
                <Button onClick={handleBack} variant="outline" className="w-1/3">אחורה</Button>
                <Button type="submit" className="w-2/3" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "שלח וקבל אפיון AI"}
                </Button>
              </div>
            </form>
          </motion.div>
        );
      case 5: // Result Step
        return (
          <motion.div key={5} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {submitted ? (
              // Confirmation message after clicking CTA
              <div className="text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-emerald-600 mx-auto" />
                <h3 className="text-2xl font-bold text-gray-900">תודה רבה!</h3>
                <p className="text-lg text-gray-600">
                  קיבלנו את הפרטים שלך ואת האפיון הראשוני
                </p>
                <p className="text-base text-gray-500">
                  נחזור אליך בהקדם לשיחה על הפתרון המתאים לעסק שלך
                </p>
                <div className="pt-4">
                  <Button 
                    onClick={() => {
                      // Reset form
                      setStep(1);
                      setFormData({
                        problem: '',
                        goal: '',
                        currentSystem: '',
                        name: '',
                        email: '',
                        phone: ''
                      });
                      setResult(null);
                      setSubmitted(false);
                      setError(null);
                    }}
                    variant="outline"
                    className="mt-4"
                  >
                    אפיון חדש
                  </Button>
                </div>
              </div>
            ) : (
              // Show results
              <>
                <h3 className="text-xl font-bold text-emerald-600 mb-3">האפיון הראשוני שלך מוכן!</h3>
                {result ? (
                  <div className="space-y-4 text-right">
                    <h4 className="text-lg font-semibold text-gray-900">{result.title}</h4>
                    
                    {/* Value Proposition */}
                    <div className="bg-emerald-50 border-r-4 border-emerald-500 p-3 rounded">
                      <h5 className="font-semibold text-emerald-800">הערך המרכזי</h5>
                      <p className="text-sm text-emerald-700">{result.valueProposition}</p>
                    </div>

                    {/* Value Boxes (Time/Efficiency) */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-100 p-2 rounded">
                        <h6 className="text-xs font-medium text-gray-500">חיסכון בזמן</h6>
                        <p className="text-sm font-semibold text-gray-800">{result.timeSaving}</p>
                      </div>
                       <div className="bg-gray-100 p-2 rounded">
                        <h6 className="text-xs font-medium text-gray-500">שיפור ביעילות</h6>
                        <p className="text-sm font-semibold text-gray-800">{result.efficiencyGain}</p>
                      </div>
                    </div>

                    {/* Steps */}
                    <div>
                      <h5 className="font-semibold mb-2">שלבי התהליך (כללי):</h5>
                      <ol className="relative border-r border-gray-200 mr-2 space-y-3">
                        {result.steps.map((step, index) => (
                          <li key={index} className="mr-4">
                            <span className="absolute -right-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-200 ring-4 ring-white"></span>
                            <h6 className="text-sm font-semibold">{step.name}</h6>
                            <p className="text-xs text-gray-500">באמצעות: {step.tool}</p>
                          </li>
                        ))}
                      </ol>
                    </div>
                    
                    <p className="text-xs text-gray-500 pt-2">זמן פיתוח מוערך: {result.estimatedTime}</p>

                    {/* CTA */}
                    <Button 
                      onClick={() => setSubmitted(true)}
                      className="w-full mt-4" 
                      size="lg"
                    >
                      רוצים לדבר על זה? בואו נקבע שיחה
                    </Button>
                  </div>
                ) : (
                  <p>טוען תוצאות...</p>
                )}
              </>
            )}
          </motion.div>
        );
      default:
        return null;
    }
  };

  // Progress bar
  const progress = (step - 1) / (totalSteps) * 100;

  return (
    <section id="ai-agent" className="w-full bg-gray-50 py-16 md:py-24" dir="rtl">
      <div className="container mx-auto max-w-2xl px-4">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <motion.div
              animate={{ rotate: [0, 10, -10, 10, 0] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 3 }}
              className="mx-auto w-fit"
            >
              <Bot className="h-10 w-10 text-emerald-600" />
            </motion.div>
            <CardTitle className="text-2xl font-bold">סוכן AI לאפיון חכם</CardTitle>
            <CardDescription>
              ענו על 3 שאלות קצרות וקבלו אפיון אוטומציה ראשוני מה-AI שלנו
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-emerald-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeInOut" }}
                />
              </div>
              <p className="text-xs text-gray-500 text-center mt-1">שלב {step > 4 ? 4 : step} מתוך {totalSteps}</p>
            </div>
            
            {/* Step Content */}
            <div className="relative overflow-hidden">
              <AnimatePresence mode="wait">
                {renderStepContent()}
              </AnimatePresence>
            </div>
            
            {/* Error Message */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-center text-sm text-red-600"
              >
                <AlertCircle className="h-4 w-4 inline-block ml-1" />
                {error}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

const Services = () => {
  const services = [
    {
      icon: MessageCircle,
      title: "בוט שירות לקוחות בוואטסאפ",
      description: "מענה מיידי 24/7 לשאלות נפוצות, קבלת פניות וזיהוי לקוחות. חוסך זמן ומעלה את שביעות הרצון.",
    },
    {
      icon: Workflow,
      title: "חיבור וסנכרון בין מערכות",
      description: "מפסיקים את ה'העתק-הדבק'. אנחנו מחברים את כל התוכנות שלכם (CRM, טפסים, מייל, וכו') לכדי תהליך אחד חלק.",
    },
    {
      icon: Users,
      title: "בוט מכירות וקביעת פגישות",
      description: "בוט שסוגר עניין. הוא שואל את הלקוח שאלות סינון, מציע זמנים פנויים וקובע פגישה ישירות ביומן שלכם.",
    },
    {
      icon: Briefcase,
      title: "אוטומציה של תהליכי תפעול",
      description: "תהליכים פנימיים כמו הפקת חשבוניות, שליחת דוחות או עדכון מלאי - הופכים לאוטומטיים, מדויקים וללא מגע יד.",
    },
  ];

  return (
    <section id="services" className="w-full bg-white py-16 md:py-24" dir="rtl">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">מה אנחנו עושים?</h2>
          <p className="mt-4 text-lg text-gray-600">
            אנחנו מתמחים בפתרונות שמפנים לכם את הזמן להתעסק במה שחשוב באמת.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <service.icon className="h-6 w-6" />
                  </div>
                  <CardTitle>{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{service.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const HowItWorks = () => {
  const steps = [
    {
      id: "01",
      name: "אבחון מהיר (שיחה או וואטסאפ)",
      description: "נבין יחד איפה הבעיה, איפה 'נשרף' הזמן, ומה המטרה העסקית שאליה אנחנו רוצים להגיע. בלי ז'רגון טכני.",
    },
    {
      id: "02",
      name: "פתרון ראשוני מהיר (תוך שבוע)",
      description: "במקום לדבר חודשים, אנחנו בונים פתרון קטן ומהיר. תוך ימים בודדים כבר תרגישו את השינוי ותראו ערך.",
    },
    {
      id: "03",
      name: "פריסה, הטמעה ומדידה",
      description: "אחרי שהפתרון הראשוני עובד, נרחיב אותו ונטמיע אותו באופן מלא בעסק. נגדיר מדדים ברורים להצלחה.",
    },
    {
      id: "04",
      name: "שיפור מתמיד על בסיס נתונים",
      description: "התהליך לא נגמר בהטמעה. נמשיך לבחון את הנתונים, לזהות צווארי בקבוק חדשים ולשפר את התהליך כל הזמן.",
    },
  ];

  return (
    <section id="how-it-works" className="w-full bg-gray-50 py-16 md:py-24" dir="rtl">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">איך זה עובד?</h2>
          <p className="mt-4 text-lg text-gray-600">
            תהליך פשוט, מהיר וממוקד בתוצאות.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-y-12 md:grid-cols-2 md:gap-x-8 lg:grid-cols-4">
          {steps.map((step) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center text-center md:items-start md:text-right"
            >
              <span className="text-4xl font-bold text-emerald-600">{step.id}</span>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">{step.name}</h3>
              <p className="mt-2 text-base text-gray-600">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const IntegrationsStrip = () => {
  const integrations = [
    // --- Core Tools ---
    { name: "Make", icon: Zap, color: "#6600FF" }, // Make.com purple
    { name: "n8n.io", icon: Workflow, color: "#7A00FF" }, // n8n purple
    { name: "Zapier", icon: Zap, color: "#FF4A00" }, // Zapier orange
    
    // --- Communication ---
    { name: "WhatsApp", icon: MessageCircle, color: "#25D366" }, // WhatsApp green
    { name: "Slack", icon: Slack, color: "#4A154B" }, // Slack deep purple
    { name: "Gmail", icon: Mail, color: "#EA4335" }, // Google Red
    
    // --- CRM / PM ---
    { name: "Monday.com", icon: Briefcase, color: "#007AFA" }, // Monday blue
    { name: "HubSpot", icon: Users, color: "#FF7A59" }, // HubSpot orange
    { name: "Pipedrive", icon: Workflow, color: "#21D789" }, // Pipedrive green
    
    // --- Google Suite ---
    { name: "Google Sheets", icon: Database, color: "#34A853" }, // Sheets green
    { name: "Google Calendar", icon: Calendar, color: "#4285F4" }, // Calendar blue
    { name: "Google Drive", icon: Server, color: "#FFBA00" }, // Drive yellow
    
    // --- E-commerce ---
    { name: "Shopify", icon: ShoppingCart, color: "#7AB55C" }, // Shopify green
    { name: "Stripe", icon: CreditCard, color: "#635BFF" }, // Stripe blue
    
    // --- General ---
    { name: "Webhooks", icon: Link, color: "#333333" }, // Generic dark
    { name: "REST API", icon: Server, color: "#007ACC" }, // Generic blue
  ];

  // Duplicate for seamless scroll
  const extendedIntegrations = [...integrations, ...integrations];

  return (
    <div className="w-full bg-white py-12" dir="ltr">
      <div className="relative w-full overflow-hidden">
        <motion.div
          className="flex"
          animate={{
            x: ['-100%', '0%'],
            transition: {
              ease: 'linear',
              duration: 40,
              repeat: Infinity,
            },
          }}
        >
          {extendedIntegrations.map((tech, index) => (
            <div key={index} className="flex-shrink-0 w-48 px-4" style={{ minWidth: '192px' }}>
              <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-lg">
                <tech.icon className="h-6 w-6" style={{ color: tech.color }} />
                <span className="text-sm font-medium text-gray-700">{tech.name}</span>
              </div>
            </div>
          ))}
        </motion.div>
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent"></div>
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent"></div>
      </div>
    </div>
  );
};

const CaseStudies = () => {
  const projects = [
    {
      title: "אוטומציית הצעת מחיר למשתלה",
      description: "פיתוח בוט וואטסאפ ששואל את הלקוח שאלות על הגינה, שולח את הנתונים לחישוב אוטומטי, ומחזיר ללקוח הצעת מחיר מסודרת תוך דקות.",
      tags: ["וואטסאפ", "חישוב אוטומטי", "שירות לקוחות"],
    },
    {
      title: "בוט לקביעת תורים למספרה",
      description: "הלקוח כותב בוואטסאפ 'אני רוצה תור'. הבוט בודק זמינות ביומן, מציע שעות פנויות, וקובע את התור אוטומטית ללא צורך במענה אנושי.",
      tags: ["וואטסאפ", "ניהול יומן", "חיסכון בזמן"],
    },
    {
      title: "אוטומציית ניהול הזמנות (חנות אונליין)",
      description: "תהליך אוטומטי שמושך הזמנות מהאתר, מעדכן את המלאי, שולח אישור ללקוח, ומעביר את פרטי המשלוח לחברת השליחויות - הכל בלחיצת כפתור.",
      tags: ["איקומרס", "ניהול מלאי", "תפעול"],
    },
  ];

  return (
    <section id="case-studies" className="w-full bg-white py-16 md:py-24" dir="rtl">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">פרויקטים ודוגמאות</h2>
          <p className="mt-4 text-lg text-gray-600">
            ככה נראים פתרונות אוטומציה בעולם האמיתי.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="h-full flex flex-col justify-between overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{project.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{project.description}</CardDescription>
                </CardContent>
                <CardFooter className="flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ConsultationBooker = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!formData.name || !formData.email || !formData.phone) {
      setError("אנא מלאו את כל השדות.");
      setLoading(false);
      return;
    }

    try {
      await trackEvent('form_submit_consultation', formData);
      setSuccess(true);
      setFormData({ name: '', email: '', phone: '' }); // Clear form
    } catch (err) {
      setError("אירעה שגיאה בשליחת הטופס. אנא נסו שוב.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="consultation" className="w-full bg-black py-16 md:py-24" dir="rtl">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
            className="text-center md:text-right"
          >
            <div className="flex justify-center md:justify-end mb-6">
              <div className="bg-white rounded-full p-3">
                <img src={KatzavLogo} alt="Katzav AI" className="h-12 w-12" />
              </div>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              בואו נדבר על האוטומציה הבאה שלכם
            </h2>
            <p className="mt-4 text-lg text-gray-300">
              רוצים לשמוע איך אפשר לייעל את העסק שלכם? השאירו פרטים ונחזור אליכם לשיחת אבחון קצרה, ללא עלות וללא התחייבות.
            </p>
            <p className="mt-4 text-gray-400">
              מעדיפים וואטסאפ? אין בעיה.
            </p>
            <Button asChild size="lg" variant="outline" className="mt-4 bg-transparent text-white border-2 border-white hover:bg-white hover:text-black">
              <a href="https://wa.me/972528023630" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-5 w-5 ml-2" />
                שלחו הודעה בוואטסאפ
              </a>
            </Button>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="shadow-2xl">
              <CardContent className="p-6">
                {success ? (
                  <div className="flex flex-col items-center justify-center text-center h-48">
                    <CheckCircle className="h-12 w-12 text-emerald-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900">הפרטים נשלחו!</h3>
                    <p className="text-sm text-gray-600">ניצור קשר בהקדם.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="name-consult" className="sr-only">שם מלא</label>
                      <Input id="name-consult" name="name" type="text" placeholder="שם מלא" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div>
                      <label htmlFor="email-consult" className="sr-only">אימייל</label>
                      <Input id="email-consult" name="email" type="email" placeholder="אימייל" value={formData.email} onChange={handleChange} required />
                    </div>
                    <div>
                      <label htmlFor="phone-consult" className="sr-only">טלפון</label>
                      <Input id="phone-consult" name="phone" type="tel" placeholder="טלפון" value={formData.phone} onChange={handleChange} required />
                    </div>
                    <Button type="submit" className="w-full" size="lg" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "אני רוצה שיחה"}
                    </Button>
                    {error && (
                      <p className="text-xs text-red-600 text-center">{error}</p>
                    )}
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const Testimonials = () => {
  const testimonials = [
    {
      name: "יוסי כהן",
      role: "מנהל, משתלת 'הכל ירוק'",
      quote: "הבוט בוואטסאפ חוסך לנו לפחות שעתיים ביום של מענה לפניות. הלקוחות מקבלים הצעת מחיר מיידית ואנחנו סוגרים יותר עסקאות.",
    },
    {
      name: "מיכל לוי",
      role: "בעלים, מספרת 'שיק'",
      quote: "מאז שהתחלנו עם הבוט לקביעת תורים, הטלפון לא מפסיק לצלצל - כי הוא פשוט לא מצלצל! הכל קורה אוטומטי. זה גאוני.",
    },
    {
      name: "דניאל שוורץ",
      role: "מנהל איקומרס, 'טבע-סטור'",
      quote: "האוטומציה בתהליך ההזמנות הורידה לנו את כמות הטעויות לאפס וקיצרה את זמן הטיפול בהזמנה מ-15 דקות לדקה. מדהים.",
    },
  ];

  return (
    <section id="testimonials" className="w-full bg-gray-50 py-16 md:py-24" dir="rtl">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">לקוחות ממליצים</h2>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="h-full">
                <CardContent className="p-6">
                  <p className="text-lg text-gray-700">"{testimonial.quote}"</p>
                </CardContent>
                <CardFooter>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FAQ = () => {
  const faqs = [
    {
      value: "q1",
      question: "כמה זמן לוקח להקים פתרון כזה?",
      answer: "זה תלוי במורכבות. בוט וואטסאפ בסיסי יכול לעלות לאוויר תוך 3-5 ימים. אוטומציות מורכבות יותר עשויות לקחת שבוע עד שבועיים. אנחנו מתחילים תמיד מפתרון מהיר כדי שתראו ערך כמה שיותר מהר."
    },
    {
      value: "q2",
      question: "האם אני חייב להתחיל בגדול?",
      answer: "ממש לא. אנחנו מאמינים בלהתחיל בקטן. נזהה יחד את התהליך הכי כואב או הכי חשוב, נבנה לו פתרון, נמדוד את ההצלחה ורק אז נמשיך לדבר הבא. "
    },
    {
      value: "q3",
      question: "האם אתם עובדים עם המערכות הקיימות שלי?",
      answer: "כן, ברוב המכריע של המקרים. אנחנו מתמחים בחיבור בין מערכות קיימות. בין אם זה CRM, מערכת הנהלת חשבוניות, אתר אינטרנט או אפילו גוגל שיטס פשוט - אנחנו יודעים לגרום להם לדבר אחד עם השני."
    },
    {
      value: "q4",
      question: "מה לגבי עלויות הרישיון של וואטסאפ?",
      answer: "העלויות של וואטסאפ עצמן (דרך מטא) הן נמוכות מאוד ומשולמות לפי שיחה. אנחנו נסביר לכם בדיוק את מבנה העלויות וניתן הערכה מדויקת כחלק מהצעת המחיר."
    },
    {
      value: "q5",
      question: "מה קורה אם משהו נשבר או מפסיק לעבוד?",
      answer: "אנחנו בונים מערכות ניטור אוטומטיות שמתריעות לנו על כל תקלה, הרבה פעמים עוד לפני שאתם שמתם לב. אנחנו מספקים שירות ותמיכה שוטפים כדי להבטיח שהכל עובד חלק."
    },
    {
      value: "q6",
      question: "איך אתם מטפלים באבטחת מידע ופרטיות?",
      answer: "אנחנו מתייחסים לזה ברצינות תהומית. אנחנו לא שומרים מידע רגיש שלא לצורך, עובדים לפי כללי אבטחה מחמירים ומוודאים שכל המידע של הלקוחות שלכם מאובטח ומוצפן כראוי."
    },
  ];

  return (
    <section id="faq" className="w-full bg-white py-16 md:py-24" dir="rtl">
      <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">שאלות נפוצות</h2>
        </div>
        <div className="mt-12">
          <Accordion>
            {faqs.map((faq) => (
              <AccordionItem key={faq.value} value={faq.value}>
                <AccordionTrigger className="text-right text-lg">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-base text-gray-600">{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

const LeadCaptureForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!formData.name || !formData.email || !formData.phone) {
      setError("אנא מלאו את כל השדות.");
      setLoading(false);
      return;
    }

    try {
      await trackEvent('default_lead', { ...formData, source: 'BottomForm' });
      setSuccess(true);
      setFormData({ name: '', email: '', phone: '' }); // Clear form
    } catch (err) {
      setError("אירעה שגיאה בשליחת הטופס. אנא נסו שוב.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="lead-capture" className="w-full bg-gray-50 py-16 md:py-24" dir="rtl">
      <div className="container mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          רוצים שנחזור אליכם עם רעיון לאוטומציה?
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          השאירו פרטים ונחשוב יחד איך לייעל את העסק שלכם.
        </p>
        
        {success ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8 flex flex-col items-center justify-center text-center bg-white p-8 rounded-lg shadow-lg"
            >
              <CheckCircle className="h-16 w-16 text-emerald-600 mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900">תודה!</h3>
              <p className="text-lg text-gray-600">הפרטים נשלחו, ניצור קשר בהקדם.</p>
            </motion.div>
        ) : (
          <motion.form 
            onSubmit={handleSubmit} 
            className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Input id="name-bottom" name="name" type="text" placeholder="שם מלא" value={formData.name} onChange={handleChange} required className="sm:col-span-1" />
            <Input id="email-bottom" name="email" type="email" placeholder="אימייל" value={formData.email} onChange={handleChange} required className="sm:col-span-1" />
            <Input id="phone-bottom" name="phone" type="tel" placeholder="טלפון" value={formData.phone} onChange={handleChange} required className="sm:col-span-1" />
            
            <Button type="submit" className="w-full sm:col-span-3" size="lg" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "כן, בואו נדבר"}
            </Button>
            
            {error && (
              <p className="text-sm text-red-600 text-center sm:col-span-3">{error}</p>
            )}
          </motion.form>
        )}
        
      </div>
    </section>
  );
};

const Contact = () => {
  const contacts = [
    {
      name: "וואטסאפ",
      value: "שלחו הודעה מהירה",
      icon: MessageCircle,
      href: "https://wa.me/972528023630",
    },
    {
      name: "אימייל",
      value: "info@katzav.ai",
      icon: Mail,
      href: "mailto:info@katzav.ai",
    },
    {
      name: "טלפון",
      value: "052-8023630",
      icon: PhoneCall,
      href: "tel:052-8023630",
    },
  ];

  return (
    <section id="contact" className="w-full bg-white py-16 md:py-24" dir="rtl">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">יצירת קשר</h2>
          <p className="mt-4 text-lg text-gray-600">
            בחרו את הדרך הנוחה לכם. אנחנו זמינים.
          </p>
        </div>
        <div className="mt-16 flex flex-wrap justify-center gap-8 md:gap-6 lg:gap-8">
          {contacts.map((contact) => (
            <motion.a
              key={contact.name}
              href={contact.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5 }}
              className="block w-full sm:w-80"
            >
              <Card className="h-full hover:shadow-lg hover:border-emerald-500 transition-all text-center">
                <CardHeader className="flex flex-col items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <contact.icon className="h-8 w-8" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{contact.name}</CardTitle>
                    <CardDescription className="text-base mt-2">{contact.value}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="w-full bg-black text-gray-400 py-12" dir="rtl">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between md:flex-row">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-full p-1.5">
              <img src={KatzavLogo} alt="Katzav AI" className="h-6 w-6" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">KATZAV AI</span>
          </div>
          <div className="mt-4 flex gap-x-6 md:mt-0">
            <a href="#services" className="text-sm hover:text-white transition-colors">שירותים</a>
            <a href="#faq" className="text-sm hover:text-white transition-colors">שאלות נפוצות</a>
            <a href="#contact" className="text-sm hover:text-white transition-colors">יצירת קשר</a>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-800 pt-8 text-center text-sm md:text-left">
          <p>&copy; {new Date().getFullYear()} Katzav AI. כל הזכויות שמורות.</p>
        </div>
      </div>
    </footer>
  );
};

// --- WhatsApp Icon & Floating Button ---

const WhatsAppIcon = (props) => (
  <svg
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    role="img"
    className="h-8 w-8"
    {...props}
  >
    <path
      d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.48-.33-.48-.143 0-1.447.215-1.518.215a.426.426 0 0 0-.315.073c-.372.33-.58.86-.58 1.49 0 .63.58 1.39.66 1.49.143.143.286.33.286.73s-.516 1.67-.63 1.832c-.143.143-.33.215-.402.215-.143 0-.33-.073-.73-.402-.402-.33-1.447-.945-2.415-1.832a.426.426 0 0 1-.143-.33c-.516-1.217-.832-2.335-.832-3.453 0-1.116.33-2.163.945-2.946.63-.78 1.39-1.447 2.335-1.832 1.018-.402 2.163-.58 3.3-.58h.073c1.116 0 2.163.143 3.15.58 1.018.402 1.832 1.018 2.507 1.832.63.78.945 1.832.945 2.946 0 1.116-.33 2.21-1.018 3.3a.426.426 0 0 1-.143.33Z"
      fill="currentColor"
    ></path>
  </svg>
);

const FloatingWhatsApp = () => {
  return (
    <motion.a
      href="https://wa.me/972528023630"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="דברו איתנו בוואטסאפ"
      className="fixed bottom-6 left-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, duration: 0.5, type: 'spring' }}
      whileHover={{ scale: 1.1 }}
    >
      <WhatsAppIcon />
    </motion.a>
  );
};


// --- Main App Component ---

export default function App() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900" dir="rtl">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-0 focus:left-0 focus:bg-white focus:p-4 focus:ring">
        דלג לתוכן הראשי
      </a>
      
      <Header />
      
      <main id="main-content">
        <Hero />
        <DiagnosticWidget />
        <Services />
        <HowItWorks />
        <IntegrationsStrip />
        <CaseStudies />
        <ConsultationBooker />
        <Testimonials />
        <FAQ />
        <LeadCaptureForm />
        <Contact />
      </main>
      
      <Footer />
      
      <FloatingWhatsApp />
    </div>
  );
}

