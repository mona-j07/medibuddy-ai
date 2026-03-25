-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    name TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    email TEXT UNIQUE NOT NULL,
    region TEXT DEFAULT 'south_india',
    budget TEXT DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BMI Records
CREATE TABLE bmi_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    bmi_value DECIMAL(5,2),
    category TEXT,
    age_group TEXT,
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    age INTEGER,
    gender TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medicines
CREATE TABLE medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    dosage TEXT,
    time TIME,
    frequency TEXT DEFAULT 'daily',
    status TEXT DEFAULT 'pending',
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercises
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    duration TEXT,
    time TIME,
    difficulty TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    report_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bmi_records_user_id ON bmi_records(user_id);
CREATE INDEX idx_bmi_records_created_at ON bmi_records(created_at);
CREATE INDEX idx_medicines_user_id ON medicines(user_id);
CREATE INDEX idx_medicines_time ON medicines(time);
CREATE INDEX idx_exercises_user_id ON exercises(user_id);
CREATE INDEX idx_exercises_time ON exercises(time);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bmi_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own BMI records" ON bmi_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own BMI records" ON bmi_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own medicines" ON medicines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own medicines" ON medicines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own medicines" ON medicines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own exercises" ON exercises FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own exercises" ON exercises FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exercises" ON exercises FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own reports" ON reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reports" ON reports FOR INSERT WITH CHECK (auth.uid() = user_id);