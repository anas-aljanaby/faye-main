import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSponsors } from '../hooks/useSponsors';
import { useOrphans } from '../hooks/useOrphans';
import { useFinancialTransactions, FinancialTransactionWithApproval } from '../hooks/useFinancialTransactions';
import { FinancialTransaction, TransactionStatus, TransactionType, Sponsor, Orphan } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Reject Transaction Modal
const RejectTransactionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onReject: (reason: string) => void;
    transactionDescription: string;
}> = ({ isOpen, onClose, onReject, transactionDescription }) => {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (reason.trim()) {
            onReject(reason.trim());
            setReason('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-2 text-red-600">رفض المعاملة</h3>
                <p className="text-sm text-text-secondary mb-4">{transactionDescription}</p>
                <form onSubmit={handleSubmit}>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="سبب الرفض..."
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md mb-4 min-h-[100px]"
                        required
                        autoFocus
                    />
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-100 text-text-secondary rounded-lg hover:bg-gray-200 font-semibold">إلغاء</button>
                        <button type="submit" className="py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold">رفض</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AddSponsorQuickModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
}> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave(name.trim());
            setName('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-4">إضافة كافل جديد</h3>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="اسم الكافل الكامل"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md mb-4"
                        required
                        autoFocus
                    />
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-100 text-text-secondary rounded-lg hover:bg-gray-200 font-semibold">إلغاء</button>
                        <button type="submit" className="py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary-hover font-semibold">إضافة</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const AddTransactionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAdd: (data: Omit<FinancialTransaction, 'id' | 'date' | 'status'>) => void;
    sponsors: Sponsor[];
    orphans: Orphan[];
    onAddSponsor: (name: string) => Promise<Sponsor>;
}> = ({ isOpen, onClose, onAdd, sponsors, orphans, onAddSponsor }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<TransactionType>(TransactionType.Expense);
    const [selectedSponsorId, setSelectedSponsorId] = useState('');
    const [selectedOrphanId, setSelectedOrphanId] = useState('');
    const [donationCategory, setDonationCategory] = useState('');
    const [isQuickAddSponsorOpen, setIsQuickAddSponsorOpen] = useState(false);
    const [orphanAmounts, setOrphanAmounts] = useState<Record<number, string>>({});
    const [sponsoredOrphans, setSponsoredOrphans] = useState<Orphan[]>([]);
    
    useEffect(() => {
        if (type === TransactionType.Income && selectedSponsorId) {
            const sponsorId = parseInt(selectedSponsorId);
            const relatedOrphans = orphans.filter(o => o.sponsorId === sponsorId);
            setSponsoredOrphans(relatedOrphans);
            setOrphanAmounts({}); // Reset amounts when sponsor changes
        } else {
            setSponsoredOrphans([]);
        }
    }, [selectedSponsorId, type, orphans]);

    useEffect(() => {
        if (type === TransactionType.Income && donationCategory === 'كفالة يتيم') {
            // FIX: Explicitly set the generic type for `reduce` to `number`.
            // This resolves an issue where TypeScript infers the accumulator `sum` as `unknown`,
            // causing downstream type errors.
            const total = Object.values(orphanAmounts).reduce<number>((sum, currentAmount) => {
                const amountAsNumber = Number(currentAmount);
                return sum + (isNaN(amountAsNumber) ? 0 : amountAsNumber);
            }, 0);
            setAmount(total > 0 ? total.toString() : '');
        }
    }, [orphanAmounts, type, donationCategory]);

    const resetForm = () => {
        setDescription('');
        setAmount('');
        setType(TransactionType.Expense);
        setSelectedSponsorId('');
        setSelectedOrphanId('');
        setDonationCategory('');
        setOrphanAmounts({});
        setSponsoredOrphans([]);
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!description.trim() || !amount) {
            alert('الرجاء ملء جميع الحقول المطلوبة.');
            return;
        }

        let transactionData: Omit<FinancialTransaction, 'id' | 'date' | 'status'>;

        if (type === TransactionType.Income) {
             if (!selectedSponsorId) {
                alert('الرجاء اختيار الكافل.');
                return;
            }
            if (!donationCategory) {
                alert('الرجاء اختيار تصنيف التبرع.');
                return;
            }
            const sponsorName = sponsors.find(s => s.id === parseInt(selectedSponsorId))?.name || 'كافل غير محدد';
            const finalDescription = `[${donationCategory}] - ${description}`;
            
            transactionData = {
                description: finalDescription,
                amount: parseFloat(amount),
                type,
                createdBy: 'خالد الغامدي', // Hardcoded team member name as requested
                receipt: {
                    sponsorName: sponsorName,
                    donationCategory: donationCategory,
                    amount: parseFloat(amount),
                    date: new Date(), // Will be overwritten by parent, but good to have
                    description: description, // Original description
                    relatedOrphanIds: Object.keys(orphanAmounts).map(id => parseInt(id)),
                    transactionId: '', // Will be set in parent
                }
            };
        } else { // Expense
            transactionData = {
                description,
                amount: parseFloat(amount),
                type,
                createdBy: 'مدير النظام',
                ...(selectedOrphanId && { orphanId: parseInt(selectedOrphanId) })
            };
        }
        
        onAdd(transactionData);
        resetForm();
    };
    
    const handleSaveNewSponsor = async (name: string) => {
        try {
            const newSponsor = await onAddSponsor(name);
            setIsQuickAddSponsorOpen(false);
            setSelectedSponsorId(newSponsor.id.toString());
        } catch (error) {
            console.error('Error saving sponsor:', error);
            alert('حدث خطأ أثناء إضافة الكافل. الرجاء المحاولة مرة أخرى.');
        }
    };

    if (!isOpen) return null;

    return (
        <>
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={resetForm}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4 text-center">إضافة حركة مالية جديدة</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setType(TransactionType.Expense);
                                setSelectedSponsorId('');
                                setDonationCategory('');
                                setAmount('');
                            }}
                            className={`w-full py-2 px-4 rounded-lg font-semibold text-center transition-colors duration-200 ${
                                type === TransactionType.Expense ? 'bg-red-500 text-white shadow-md' : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                        >
                            مصروف
                        </button>
                        <button
                            type="button"
                            onClick={() => setType(TransactionType.Income)}
                            className={`w-full py-2 px-4 rounded-lg font-semibold text-center transition-colors duration-200 ${
                                type === TransactionType.Income ? 'bg-green-500 text-white shadow-md' : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                        >
                            إيراد
                        </button>
                    </div>
                    
                    {type === TransactionType.Income && (
                         <>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">الكافل</label>
                                <div className="flex items-center gap-2">
                                    <select value={selectedSponsorId} onChange={(e) => setSelectedSponsorId(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md" required>
                                        <option value="" disabled>-- اختر الكافل --</option>
                                        {sponsors.map(sponsor => (
                                            <option key={sponsor.id} value={sponsor.id}>{sponsor.name}</option>
                                        ))}
                                    </select>
                                    <button type="button" onClick={() => setIsQuickAddSponsorOpen(true)} className="flex-shrink-0 h-10 w-10 bg-primary-light text-primary rounded-md flex items-center justify-center hover:bg-primary-hover hover:text-white transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">تصنيف التبرع</label>
                                <select value={donationCategory} onChange={(e) => {
                                    setDonationCategory(e.target.value);
                                    if (e.target.value !== 'كفالة يتيم') {
                                        setAmount(''); 
                                    }
                                }} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md" required>
                                    <option value="" disabled>-- اختر التصنيف --</option>
                                    <option value="كفالة يتيم">كفالة يتيم</option>
                                    <option value="تبرع عام">تبرع عام</option>
                                </select>
                            </div>
                            {donationCategory === 'كفالة يتيم' && selectedSponsorId && (
                                <div className="border-t pt-4 mt-4 space-y-3 max-h-40 overflow-y-auto pr-2">
                                    <h4 className="text-md font-semibold text-gray-800">توزيع مبلغ الكفالة</h4>
                                    {sponsoredOrphans.length > 0 ? (
                                        sponsoredOrphans.map(orphan => (
                                            <div key={orphan.id} className="flex items-center gap-2">
                                                <span className="w-1/3 truncate text-sm">{orphan.name}</span>
                                                <div className="flex-grow flex items-center gap-1">
                                                    <input 
                                                        type="number" 
                                                        placeholder="المبلغ" 
                                                        value={orphanAmounts[orphan.id] || ''}
                                                        onChange={(e) => setOrphanAmounts(prev => ({ ...prev, [orphan.id]: e.target.value }))}
                                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md" 
                                                    />
                                                    <button type="button" onClick={() => setOrphanAmounts(prev => ({ ...prev, [orphan.id]: '50' }))} className="text-xs px-2 py-1 bg-gray-200 rounded-md hover:bg-gray-300 flex-shrink-0">شهر</button>
                                                    <button type="button" onClick={() => setOrphanAmounts(prev => ({ ...prev, [orphan.id]: '600' }))} className="text-xs px-2 py-1 bg-gray-200 rounded-md hover:bg-gray-300 flex-shrink-0">سنة</button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
                                            لم يتم العثور على أيتام مكفولين لهذا الكافل.
                                        </p>
                                    )}
                                </div>
                            )}
                         </>
                    )}

                    {type === TransactionType.Expense && (
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">ربط المصروف بيتيم (اختياري)</label>
                            <select value={selectedOrphanId} onChange={(e) => setSelectedOrphanId(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md">
                                <option value="">-- لا يوجد --</option>
                                {orphans.map(orphan => (
                                    <option key={orphan.id} value={orphan.id}>{orphan.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="البيان" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md" required autoFocus/>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="المبلغ" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md" required disabled={type === TransactionType.Income && donationCategory === 'كفالة يتيم'} />
                    
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={resetForm} className="py-2 px-5 bg-gray-100 text-text-secondary rounded-lg hover:bg-gray-200 font-semibold">إلغاء</button>
                        <button type="submit" className="py-2 px-5 bg-primary text-white rounded-lg hover:bg-primary-hover font-semibold">
                            {type === TransactionType.Income ? 'اصدار إيصال تبرع' : 'حفظ'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
        <AddSponsorQuickModal 
            isOpen={isQuickAddSponsorOpen}
            onClose={() => setIsQuickAddSponsorOpen(false)}
            onSave={handleSaveNewSponsor}
        />
        </>
    );
};


const ReceiptModal: React.FC<{ transaction: FinancialTransaction | null; onClose: () => void; }> = ({ transaction, onClose }) => {
    const receiptRef = useRef<HTMLDivElement>(null);

    if (!transaction || !transaction.receipt) return null;
    
    const { receipt } = transaction;

    const handleExportPDF = () => {
        const input = receiptRef.current;
        if(input) {
            html2canvas(input, { scale: 2, useCORS: true }).then((canvas) => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`ايصال-${receipt.transactionId}.pdf`);
            });
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <div id="printable-receipt" ref={receiptRef} className="p-8 text-text-primary bg-white">
                    <div className="border-b-2 border-primary pb-4 mb-6 text-center">
                        <h2 className="text-3xl font-bold text-primary">إيصال تبرع</h2>
                        <p className="text-sm text-text-secondary">منظمة فيء لرعاية الأيتام</p>
                    </div>
                    <div className="flex justify-between mb-6 text-sm">
                        <div>
                            <p><strong>رقم الإيصال:</strong> {receipt.transactionId}</p>
                            <p><strong>التاريخ:</strong> {receipt.date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                        <div className="text-left">
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="currentColor" className="text-primary inline-block">
                                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                            </svg>
                        </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
                        <p><strong>استلمنا من السيد/السيدة:</strong> <span className="font-semibold text-lg">{receipt.sponsorName}</span></p>
                        <p><strong>مبلغ وقدره:</strong> <span className="font-semibold text-lg">${receipt.amount.toLocaleString()}</span></p>
                        <p><strong>وذلك عن:</strong> <span className="font-semibold">[{receipt.donationCategory}] - {receipt.description}</span></p>
                    </div>
                    <div className="flex justify-between items-end text-sm">
                        <div>
                            <p>المستلم: خالد الغامدي</p>
                            <p className="mt-4 border-t-2 border-dashed w-32 pt-1">توقيع المستلم</p>
                        </div>
                        <div className="text-center">
                            <p className="font-bold">شكراً لمساهمتكم</p>
                        </div>
                    </div>
                </div>
                 <div className="bg-gray-100 p-4 flex justify-end gap-3 rounded-b-lg">
                    <button onClick={onClose} className="py-2 px-5 bg-gray-200 text-text-secondary rounded-lg hover:bg-gray-300 font-semibold">إغلاق</button>
                    <button onClick={() => window.print()} className="py-2 px-5 bg-primary-light text-primary rounded-lg hover:bg-primary hover:text-white transition-colors font-semibold flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                        طباعة
                    </button>
                    <button onClick={handleExportPDF} className="py-2 px-5 bg-primary text-white rounded-lg hover:bg-primary-hover font-semibold flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                        PDF
                    </button>
                </div>
            </div>
        </div>
    );
};


const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-bg-card p-4 rounded-lg shadow flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-text-secondary text-sm">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    </div>
);

const TrendsChart: React.FC = () => {
    const data = {
        labels: ['يناير', 'مارس', 'مايو', 'يوليو', 'سبتمبر', 'نوفمبر'],
        datasets: [
            {
                label: 'إيرادات',
                data: [1200, 1900, 3000, 5000, 2000, 3000].map(v => v * 1.5), // Example data
                backgroundColor: '#10B981',
                borderRadius: 6,
            },
            {
                label: 'مصروفات',
                data: [800, 1200, 2500, 4000, 1500, 2200].map(v => v * 1.2), // Example data
                backgroundColor: '#EF4444',
                borderRadius: 6,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                align: 'end' as const,
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                    padding: 20,
                    font: { family: 'Tajawal' }
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context: any) {
                        return `${context.dataset.label}: $${context.formattedValue}`;
                    }
                }
            }
        },
        scales: {
            x: { grid: { display: false } },
            y: { 
                beginAtZero: true, 
                grid: { color: '#e5e7eb' },
                ticks: {
                    callback: function(value: any) {
                        return '$' + value;
                    }
                }
            },
        },
        interaction: {
            intersect: false,
            mode: 'index' as const,
        },
    };

    return (
        <div className="bg-bg-card p-6 rounded-lg shadow-sm h-[350px]">
            <h3 className="text-lg font-bold mb-4">توجهات الإيرادات والمصروفات</h3>
            <Bar data={data} options={options} />
        </div>
    );
};

const IncomeSourceChart: React.FC = () => {
    const data = {
        labels: ['تبرعات الكفلاء', 'منظمات خارجية'],
        datasets: [{
            data: [1600, 1000],
            backgroundColor: ['#8c1c3e', '#fbe9ef'],
            borderColor: '#fff',
            borderWidth: 2,
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    font: { family: 'Tajawal' }
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context: any) {
                        return `${context.label}: $${context.formattedValue}`;
                    }
                }
            }
        }
    };

    return (
        <div className="bg-bg-card p-6 rounded-lg shadow-sm h-[350px]">
            <h3 className="text-lg font-bold mb-4">مصادر الإيرادات</h3>
            <Pie data={data} options={options} />
        </div>
    );
}

const StatusPill: React.FC<{ status: TransactionStatus }> = ({ status }) => {
    const styles = {
        [TransactionStatus.Completed]: 'bg-green-100 text-green-800',
        [TransactionStatus.Pending]: 'bg-yellow-100 text-yellow-800',
        [TransactionStatus.Rejected]: 'bg-red-100 text-red-800',
    };
    return (
        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${styles[status]}`}>
            {status}
        </span>
    );
};


const FinancialSystem: React.FC = () => {
    const navigate = useNavigate();
    const fromDateRef = useRef<HTMLInputElement>(null);
    const toDateRef = useRef<HTMLInputElement>(null);
    const { canCreateExpense } = useAuth();
    const { sponsors: sponsorsData, refetch: refetchSponsors } = useSponsors();
    const { orphans: orphansData } = useOrphans();
    const { 
        transactions, 
        loading: transactionsLoading, 
        addTransaction: addTransactionToDB, 
        addSponsor: addSponsorToDB, 
        refetch: refetchTransactions,
        approveTransaction,
        rejectTransaction,
        deleteTransaction,
        canApproveExpense,
        canEditTransactions,
        canCreateExpenseDirectly,
    } = useFinancialTransactions();
    const [sponsorsList, setSponsorsList] = useState(sponsorsData);
    
    // Filter states
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('كل الأنواع');
    const [statusFilter, setStatusFilter] = useState<string>('كل الحالات');
    const [activeMonthFilter, setActiveMonthFilter] = useState<string>('هذا العام');
    
    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [receiptToShow, setReceiptToShow] = useState<FinancialTransaction | null>(null);
    const [transactionToReject, setTransactionToReject] = useState<FinancialTransactionWithApproval | null>(null);
    const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
    
    useEffect(() => {
        if (sponsorsData) {
            setSponsorsList(sponsorsData);
        }
    }, [sponsorsData]);

    // Initialize default month filter on mount
    useEffect(() => {
        const today = new Date();
        const year = today.getFullYear();
        const from = new Date(year, 0, 1);
        from.setHours(0, 0, 0, 0);
        const to = new Date(today);
        to.setHours(23, 59, 59, 999);
        
        setFromDate(from.toISOString().split('T')[0]);
        setToDate(to.toISOString().split('T')[0]);
    }, []);

    // Close action menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActionMenuOpen(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleApprove = async (transactionId: string) => {
        const result = await approveTransaction(transactionId);
        if (!result.success) {
            alert(result.error || 'حدث خطأ أثناء الموافقة');
        }
        setActionMenuOpen(null);
    };

    const handleReject = async (reason: string) => {
        if (!transactionToReject) return;
        const result = await rejectTransaction(transactionToReject.id, reason);
        if (!result.success) {
            alert(result.error || 'حدث خطأ أثناء الرفض');
        }
        setTransactionToReject(null);
        setActionMenuOpen(null);
    };

    const handleDelete = async (transactionId: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه المعاملة؟')) return;
        const result = await deleteTransaction(transactionId);
        if (!result.success) {
            alert(result.error || 'حدث خطأ أثناء الحذف');
        }
        setActionMenuOpen(null);
    };

    // Month filter handlers
    const handleMonthFilter = (filter: string) => {
        setActiveMonthFilter(filter);
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        
        let from: Date;
        let to: Date = new Date(today);
        to.setHours(23, 59, 59, 999);
        
        switch (filter) {
            case 'هذا الشهر':
                from = new Date(year, month, 1);
                from.setHours(0, 0, 0, 0);
                break;
            case 'آخر 3 أشهر':
                from = new Date(year, month - 2, 1);
                from.setHours(0, 0, 0, 0);
                break;
            case 'هذا العام':
            default:
                from = new Date(year, 0, 1);
                from.setHours(0, 0, 0, 0);
                break;
        }
        
        setFromDate(from.toISOString().split('T')[0]);
        setToDate(to.toISOString().split('T')[0]);
    };

    // Filter transactions based on filter criteria
    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            // Date filter
            if (fromDate) {
                const txDate = new Date(tx.date);
                const from = new Date(fromDate);
                from.setHours(0, 0, 0, 0);
                if (txDate < from) return false;
            }
            if (toDate) {
                const txDate = new Date(tx.date);
                const to = new Date(toDate);
                to.setHours(23, 59, 59, 999);
                if (txDate > to) return false;
            }
            
            // Type filter
            if (typeFilter !== 'كل الأنواع') {
                if (typeFilter === 'إيرادات' && tx.type !== TransactionType.Income) return false;
                if (typeFilter === 'مصروفات' && tx.type !== TransactionType.Expense) return false;
            }
            
            // Status filter
            if (statusFilter !== 'كل الحالات') {
                const statusMap: Record<string, TransactionStatus> = {
                    'مكتملة': TransactionStatus.Completed,
                    'قيد المراجعة': TransactionStatus.Pending,
                    'مرفوضة': TransactionStatus.Rejected,
                };
                if (tx.status !== statusMap[statusFilter]) return false;
            }
            
            return true;
        });
    }, [transactions, fromDate, toDate, typeFilter, statusFilter]);

    const { totalIncome, totalExpenses, balance, pendingCount } = useMemo(() => {
        const income = transactions
            .filter(tx => tx.type === TransactionType.Income && tx.status === TransactionStatus.Completed)
            .reduce((sum, tx) => sum + tx.amount, 0);
        
        const expenses = transactions
            .filter(tx => tx.type === TransactionType.Expense && tx.status === TransactionStatus.Completed)
            .reduce((sum, tx) => sum + tx.amount, 0);
            
        const pending = transactions.filter(tx => tx.status === TransactionStatus.Pending).length;

        return {
            totalIncome: income,
            totalExpenses: expenses,
            balance: income - expenses,
            pendingCount: pending,
        };
    }, [transactions]);

    const handleAddSponsor = async (name: string): Promise<Sponsor> => {
        try {
            const newSponsor = await addSponsorToDB(name);
            // Refresh sponsors list
            await refetchSponsors();
            return newSponsor;
        } catch (error) {
            console.error('Error adding sponsor:', error);
            // Fallback to local state if DB operation fails
            const fallbackSponsor: Sponsor = {
                id: Date.now(),
                name,
                avatarUrl: '',
                sponsoredOrphanIds: [],
            };
            setSponsorsList(prev => [fallbackSponsor, ...prev]);
            return fallbackSponsor;
        }
    };

    const handleAddTransaction = async (data: Omit<FinancialTransaction, 'id' | 'date' | 'status'>) => {
        try {
            const transactionId = await addTransactionToDB(data);
            setIsAddModalOpen(false);

            // Refresh transactions to get the new one with receipt
            await refetchTransactions();
            
            // Find the newly added transaction to show receipt if it's income
            if (data.type === TransactionType.Income && transactionId) {
                // Use a small delay to ensure state is updated after refetch
                setTimeout(() => {
                    // Find the transaction by ID
                    const newTransaction = transactions.find(tx => tx.id === transactionId);
                    if (newTransaction && newTransaction.receipt) {
                        setReceiptToShow(newTransaction);
                    } else {
                        // Fallback: find the most recent income transaction with receipt
                        const latestIncome = transactions
                            .filter(tx => tx.type === TransactionType.Income && tx.receipt)
                            .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
                        if (latestIncome) {
                            setReceiptToShow(latestIncome);
                        }
                    }
                }, 500);
            }
        } catch (error) {
            console.error('Error adding transaction:', error);
            alert('حدث خطأ أثناء إضافة الحركة المالية. الرجاء المحاولة مرة أخرى.');
        }
    };

    const handleExport = () => {
        const headers = ['id', 'date', 'description', 'createdBy', 'amount', 'status', 'type'];
        const csvRows = [
            headers.join(','),
            ...filteredTransactions.map(tx => [
                tx.id,
                tx.date.toISOString().split('T')[0],
                `"${tx.description.replace(/"/g, '""')}"`,
                `"${tx.createdBy}"`,
                tx.amount,
                tx.status,
                tx.type
            ].join(','))
        ];
        const csvContent = '\uFEFF' + csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', 'fay-financials.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
        <div className="space-y-6 pb-24 sm:pb-0">
            <div>
                <h1 className="text-3xl font-bold">النظام المالي</h1>
                <p className="text-text-secondary">عرض وإدارة جميع الحركات المالية.</p>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-bold">لوحة التحكم المالية</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                     <StatCard title="الرصيد" value={`$${balance.toLocaleString()}`} color="bg-blue-100" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4Z"/></svg>} />
                    <StatCard title="إجمالي الإيرادات" value={`$${totalIncome.toLocaleString()}`} color="bg-green-100" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>} />
                    <StatCard title="إجمالي المصروفات" value={`$${totalExpenses.toLocaleString()}`} color="bg-red-100" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>} />
                    <StatCard title="قيد المراجعة" value={pendingCount.toString()} color="bg-yellow-100" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <TrendsChart />
                </div>
                <div>
                    <IncomeSourceChart />
                </div>
            </div>
            
            <div className="bg-bg-card p-6 rounded-lg shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <h2 className="text-xl font-bold">سجل الحركات المالية</h2>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => setIsAddModalOpen(true)} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-hover flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            إضافة حركة
                        </button>
                        <div className="flex items-center bg-gray-100 rounded-lg">
                            <button 
                                onClick={() => handleMonthFilter('هذا العام')}
                                className={`py-2 px-4 text-sm font-semibold rounded-lg transition-colors ${
                                    activeMonthFilter === 'هذا العام' 
                                        ? 'bg-primary text-white' 
                                        : 'text-text-secondary hover:bg-gray-200'
                                }`}
                            >
                                هذا العام
                            </button>
                            <button 
                                onClick={() => handleMonthFilter('آخر 3 أشهر')}
                                className={`py-2 px-4 text-sm font-semibold rounded-lg transition-colors ${
                                    activeMonthFilter === 'آخر 3 أشهر' 
                                        ? 'bg-primary text-white' 
                                        : 'text-text-secondary hover:bg-gray-200'
                                }`}
                            >
                                آخر 3 أشهر
                            </button>
                            <button 
                                onClick={() => handleMonthFilter('هذا الشهر')}
                                className={`py-2 px-4 text-sm font-semibold rounded-lg transition-colors ${
                                    activeMonthFilter === 'هذا الشهر' 
                                        ? 'bg-primary text-white' 
                                        : 'text-text-secondary hover:bg-gray-200'
                                }`}
                            >
                                هذا الشهر
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 mb-4 pb-4 border-b">
                    <div className="flex items-center gap-2">
                        <label htmlFor="from-date" className="text-sm">من</label>
                        <input 
                            type="date" 
                            id="from-date" 
                            ref={fromDateRef}
                            value={fromDate}
                            onChange={(e) => {
                                setFromDate(e.target.value);
                                setActiveMonthFilter('');
                            }}
                            className="bg-white border border-gray-300 rounded-lg p-2"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="to-date" className="text-sm">إلى</label>
                        <input 
                            type="date" 
                            id="to-date" 
                            ref={toDateRef}
                            value={toDate}
                            onChange={(e) => {
                                setToDate(e.target.value);
                                setActiveMonthFilter('');
                            }}
                            className="bg-white border border-gray-300 rounded-lg p-2"
                        />
                    </div>
                    <select 
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="bg-white border border-gray-300 rounded-lg p-2 text-sm focus:ring-primary focus:border-primary"
                    >
                        <option>كل الأنواع</option>
                        <option>إيرادات</option>
                        <option>مصروفات</option>
                    </select>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white border border-gray-300 rounded-lg p-2 text-sm focus:ring-primary focus:border-primary"
                    >
                        <option>كل الحالات</option>
                        <option>مكتملة</option>
                        <option>قيد المراجعة</option>
                        <option>مرفوضة</option>
                    </select>
                    <button className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600" onClick={handleExport}>
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="text-text-secondary">
                            <tr>
                                <th className="p-3">التاريخ</th>
                                <th className="p-3">البيان</th>
                                <th className="p-3">أنشئت بواسطة</th>
                                <th className="p-3">المبلغ</th>
                                <th className="p-3">الحالة</th>
                                <th className="p-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactionsLoading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-text-secondary">
                                        جاري التحميل...
                                    </td>
                                </tr>
                            ) : filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-text-secondary">
                                        {transactions.length === 0 ? 'لا توجد حركات مالية' : 'لا توجد نتائج تطابق الفلاتر المحددة'}
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map(tx => {
                                    const txWithApproval = tx as FinancialTransactionWithApproval;
                                    const isPending = tx.status === TransactionStatus.Pending;
                                    const isRejected = tx.status === TransactionStatus.Rejected;
                                    
                                    return (
                                        <tr key={tx.id} className="border-b hover:bg-gray-50">
                                            <td className="p-3">{tx.date.toLocaleDateString('en-CA')}</td>
                                            <td className="p-3 font-semibold">
                                                <div className="flex items-center gap-2">
                                                    <span>{tx.description}</span>
                                                    {tx.receipt && (
                                                        <button onClick={() => setReceiptToShow(tx)} title="عرض الإيصال" className="text-primary hover:text-primary-hover">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                                                        </button>
                                                    )}
                                                    {isRejected && txWithApproval.rejectionReason && (
                                                        <span title={`سبب الرفض: ${txWithApproval.rejectionReason}`} className="text-red-500 cursor-help">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                                        </span>
                                                    )}
                                                </div>
                                                {txWithApproval.approvedBy && (
                                                    <div className="text-xs text-green-600 mt-1">وافق عليها: {txWithApproval.approvedBy}</div>
                                                )}
                                                {txWithApproval.rejectedBy && (
                                                    <div className="text-xs text-red-600 mt-1">رفضها: {txWithApproval.rejectedBy}</div>
                                                )}
                                            </td>
                                            <td className="p-3 text-text-secondary">{tx.createdBy}</td>
                                            <td className={`p-3 font-bold ${tx.type === TransactionType.Income ? 'text-green-600' : 'text-red-600'}`}>${tx.amount.toLocaleString()}</td>
                                            <td className="p-3"><StatusPill status={tx.status} /></td>
                                            <td className="p-3 relative">
                                                {/* Action buttons based on permissions */}
                                                {isPending && canApproveExpense && tx.type === TransactionType.Expense && (
                                                    <div className="flex items-center gap-1">
                                                        <button 
                                                            onClick={() => handleApprove(tx.id)}
                                                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                                                            title="موافقة"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                                        </button>
                                                        <button 
                                                            onClick={() => setTransactionToReject(txWithApproval)}
                                                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                                                            title="رفض"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                                        </button>
                                                    </div>
                                                )}
                                                {/* Action menu for edit/delete */}
                                                {canEditTransactions && (
                                                    <div className="relative inline-block">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActionMenuOpen(actionMenuOpen === tx.id ? null : tx.id);
                                                            }}
                                                            className="text-text-secondary hover:text-primary p-1"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                                                        </button>
                                                        {actionMenuOpen === tx.id && (
                                                            <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                                                                <button 
                                                                    onClick={() => handleDelete(tx.id)}
                                                                    className="w-full px-4 py-2 text-right text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                                                    حذف
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm shadow-[0_-2px_10px_rgba(0,0,0,0.1)] p-2 flex justify-around items-center z-30">
            <button onClick={() => navigate(-1)} className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                <span className="text-xs">رجوع</span>
            </button>
            <button onClick={() => fromDateRef.current?.focus()} className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
                <span className="text-xs">تصفية</span>
            </button>
            <button onClick={handleExport} className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                <span className="text-xs">تصدير</span>
            </button>
            <button onClick={() => setIsAddModalOpen(true)} className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                <span className="text-xs">إضافة</span>
            </button>
        </div>
        <AddTransactionModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onAdd={handleAddTransaction}
            sponsors={sponsorsList}
            orphans={orphansData}
            onAddSponsor={handleAddSponsor}
        />
        <ReceiptModal
            transaction={receiptToShow}
            onClose={() => setReceiptToShow(null)}
        />
        <RejectTransactionModal
            isOpen={!!transactionToReject}
            onClose={() => setTransactionToReject(null)}
            onReject={handleReject}
            transactionDescription={transactionToReject?.description || ''}
        />
        </>
    );
};

export default FinancialSystem;