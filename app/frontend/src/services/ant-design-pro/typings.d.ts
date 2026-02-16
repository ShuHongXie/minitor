  type ProjectList = {
    data?: ProjectListItem[];
    total?: number;
    success?: boolean;
  };

  type MonitorListItem = {
    _id: string;
    appId: string;
    type: number;
    subType?: number;
    release?: string;
    environment?: string;
    userId?: string;
    timestamp: number;
    data: any;
    browserInfo?: {
      userAgent?: string;
      screenResolution?: string;
      language?: string;
    };
  };

  type MonitorList = {
    data: MonitorListItem[];
    total: number;
    success: boolean;
  };
}
