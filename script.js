class BillingManager {
    constructor() {
        this.records = JSON.parse(localStorage.getItem('billingRecords')) || [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderRecords();
        this.updateSummary();
        this.setTodayDate();
    }

    bindEvents() {
        document.getElementById('billingForm').addEventListener('submit', (e) => this.handleSubmit(e));
        document.getElementById('statusFilter').addEventListener('change', () => this.renderRecords());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
    }

    setTodayDate() {
        document.getElementById('date').valueAsDate = new Date();
    }

    handleSubmit(e) {
        e.preventDefault();
        
        const formData = {
            id: Date.now(),
            date: document.getElementById('date').value,
            customerName: document.getElementById('customerName').value,
            quantity: parseFloat(document.getElementById('quantity').value),
            coverSize: document.getElementById('coverSize').value,
            amount: parseFloat(document.getElementById('amount').value),
            status: document.getElementById('status').value,
            manufacturer: document.getElementById('manufacturer').value,
            paymentMode: document.getElementById('paymentMode').value
        };

        this.records.push(formData);
        this.saveRecords();
        this.renderRecords();
        this.updateSummary();
        this.resetForm();
    }

    saveRecords() {
        localStorage.setItem('billingRecords', JSON.stringify(this.records));
    }

    renderRecords() {
        const filter = document.getElementById('statusFilter').value;
        const tbody = document.getElementById('recordsBody');
        
        let filteredRecords = this.records;
        if (filter !== 'all') {
            filteredRecords = this.records.filter(record => record.status === filter);
        }

        if (filteredRecords.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-state">
                        <h3>No records found</h3>
                        <p>Add your first billing record to get started</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filteredRecords
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(record => `
                <tr>
                    <td>${this.formatDate(record.date)}</td>
                    <td>${record.customerName}</td>
                    <td>${record.quantity}</td>
                    <td>${record.coverSize}</td>
                    <td>₹${record.amount.toFixed(2)}</td>
                    <td><span class="status-badge status-${record.status}">${record.status}</span></td>
                    <td>${this.capitalize(record.manufacturer)}</td>
                    <td>${this.capitalize(record.paymentMode)}</td>
                    <td><button class="btn-delete" onclick="billingManager.deleteRecord(${record.id})">Delete</button></td>
                </tr>
            `).join('');
    }

    updateSummary() {
        const totalPaid = this.records
            .filter(record => record.status === 'paid')
            .reduce((sum, record) => sum + record.amount, 0);

        const totalDue = this.records
            .filter(record => record.status === 'due')
            .reduce((sum, record) => sum + record.amount, 0);

        document.getElementById('totalPaid').textContent = `₹${totalPaid.toFixed(2)}`;
        document.getElementById('totalDue').textContent = `₹${totalDue.toFixed(2)}`;
    }

    deleteRecord(id) {
        if (confirm('Are you sure you want to delete this record?')) {
            this.records = this.records.filter(record => record.id !== id);
            this.saveRecords();
            this.renderRecords();
            this.updateSummary();
        }
    }

    resetForm() {
        document.getElementById('billingForm').reset();
        this.setTodayDate();
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-IN');
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    exportData() {
        if (this.records.length === 0) {
            alert('No data to export');
            return;
        }

        const headers = ['Date', 'Customer Name', 'Quantity (kg)', 'Cover Size', 'Amount (₹)', 'Status', 'Manufacturer', 'Payment Mode'];
        const csvContent = [
            headers.join(','),
            ...this.records.map(record => [
                record.date,
                `"${record.customerName}"`,
                record.quantity,
                record.coverSize,
                record.amount,
                record.status,
                record.manufacturer,
                record.paymentMode
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `billing-records-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
}

// Initialize the application
const billingManager = new BillingManager();